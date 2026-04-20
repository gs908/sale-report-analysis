import re
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from config.database import SessionLocal, engine
from models import GrpGroupInfo, GrpMsgRaw, GrpGroupMember
from modules.excel.msg_parser import parse_raw_group_messages_flat

BATCH_SIZE = 5000

# 拼音到中文名的映射表
PINYIN_TO_CHINESE_MAP = {
    'duanwangdong': '段旺东',
    'gaosheng': '高胜',
    'lixiguo': '李希国',
    'wangxinyi': '王心怡',
    'tangke': '唐克',
    'zhangyaoyao': '张瑶瑶',
    'lianghong': '梁宏',
    'maoxiaokun': '毛晓坤',
    'chensiqi': '陈丝琪',
    'litao02': '李涛02',
    'zhangyu02': '张誉02',
    'xieminghao': '谢明皓',
    'liujinrui': '刘锦睿',
    'aidi': '艾迪',
    'lina01': '李娜01',
    'tianbingxiang': '田炳香',
    'mojingyu': '莫京豫',
    'zhaolingling': '赵玲玲',
    'zhengyi': '郑忆',
    'liuxiaotong': '刘晓彤',
    'caokexin': '曹可心',
    'jiyushan': '纪禹杉',
    'zhaohongguo': '赵洪国',
    'liujiatong': '刘佳彤',
    'wangjianan': '王佳楠',
    'maliang': '马良',
    'liuchunling': '刘春玲',
    'tianjun': '田军',
    'zhengchao': '郑超',
    'wangying01': '王莹01',
    'yanyue': '颜悦',
    'wangfengchao': '王凤朝',
    'zhangmiaomiao': '张苗苗',
    'mengfanyu': '孟凡雨',
    'sunhui': '孙慧',
    'shimengmeng': '史蒙蒙',
    'gansujuan': '甘素娟',
}


def _get_member_name(sender_id: str) -> str:
    """根据发送人ID（拼音）获取中文名，无匹配则返回原ID"""
    if not sender_id:
        return ""
    sender_id_lower = sender_id.strip().lower()
    return PINYIN_TO_CHINESE_MAP.get(sender_id_lower, sender_id)


def _parse_msg_time(time_str: str):
    if not time_str:
        return None
    try:
        return datetime.strptime(time_str.strip(), "%Y-%m-%d %H:%M:%S")
    except Exception:
        try:
            return datetime.strptime(time_str.strip(), "%Y-%m-%d")
        except Exception:
            return None


def _extract_issue_id(receiver: str):
    if not receiver:
        return None
    match = re.search(r"WT-\d+", receiver, re.IGNORECASE)
    return match.group(0).upper() if match else None


def _upsert_group_info(session: Session, group_id: str, group_name: str, receiver: str):
    issue_id = _extract_issue_id(receiver)
    existing = session.query(GrpGroupInfo).filter(
        GrpGroupInfo.group_id == group_id
    ).first()
    if existing:
        existing.group_name = group_name
        existing.issue_id = issue_id
    else:
        session.add(GrpGroupInfo(
            group_id=group_id,
            group_name=group_name,
            issue_id=issue_id,
        ))


def import_batch(file_path: str, batch_size: int = BATCH_SIZE) -> dict:
    """
    批量导入 grp_group_info + grp_msg_raw + grp_group_member
    策略：
    - group_info: Step1 全量 upsert 并 commit
    - grp_msg_raw / grp_group_member: INSERT IGNORE（数据库层静默跳过重复键）
    """
    session = SessionLocal()
    try:
        # Step 1: 所有 group_info 一次性 upsert + commit
        group_ids: set = set()
        group_info_map: dict = {}

        for msg_data in parse_raw_group_messages_flat(file_path, batch_size=batch_size):
            group_id = str(msg_data.get("group_id") or "").strip()
            if not group_id:
                continue
            if group_id not in group_ids:
                receiver = str(msg_data.get("receiver") or "").strip()
                group_info_map[group_id] = (receiver, receiver)
                group_ids.add(group_id)

        for gid, (gname, recv) in group_info_map.items():
            _upsert_group_info(session, gid, gname, recv)
        session.commit()

        # Step 2: 子表数据分批写入（INSERT IGNORE）
        total_msg_count = 0
        total_member_count = 0
        batch_buffer = []
        for msg_data in parse_raw_group_messages_flat(file_path, batch_size=batch_size):
            batch_buffer.append(msg_data)
            if len(batch_buffer) >= batch_size:
                mc, rc = _flush_batch(batch_buffer)
                total_msg_count += mc
                total_member_count += rc
                batch_buffer = []

        if batch_buffer:
            mc, rc = _flush_batch(batch_buffer)
            total_msg_count += mc
            total_member_count += rc

        return {
            "group_count": len(group_ids),
            "msg_count": total_msg_count,
            "member_count": total_member_count,
        }
    except Exception as e:
        raise e
    finally:
        session.close()


def _flush_batch(batch: list) -> tuple:
    if not batch:
        return 0, 0

    # 识别撤回标记消息并标记需删除的上一条消息
    revoked_prev_ids = _find_revoked_messages(batch)

    conn = engine.raw_connection()
    try:
        # ── 先更新之前已入库的被撤回消息 ──
        if revoked_prev_ids:
            revoked_list = [f"'{mid}'" for mid in revoked_prev_ids]
            update_sql = (
                f"UPDATE grp_msg_raw SET is_deleted = 1 "
                f"WHERE msg_id IN ({', '.join(revoked_list)}) AND is_deleted = 0"
            )
            with conn.cursor() as cur:
                cur.execute(update_sql)
            conn.commit()

        # ── msg_raw: INSERT IGNORE ──
        msg_values = []
        for m in batch:
            msg_id = m.get("msg_id")
            if msg_id is None or not str(msg_id).strip():
                continue
            gid = str(m.get("group_id") or "").strip()
            sender_id = str(m.get("sender_id") or "").strip()  # 拼音ID
            # 将拼音映射为中文名，用于 sender 字段
            sender = _esc(_get_member_name(sender_id))
            msg_type = _esc(str(m.get("msg_type") or ""))
            msg_time = _parse_msg_time(m.get("msg_time") or "")
            msg_content = _esc(str(m.get("msg_content") or ""))
            receiver = _esc(str(m.get("receiver") or ""))
            issue_id_val = _extract_issue_id(str(m.get("receiver") or "") or "")
            msg_time_val = f"'{msg_time.strftime('%Y-%m-%d %H:%M:%S')}'" if msg_time else "NULL"
            issue_id_val_sql = f"'{issue_id_val}'" if issue_id_val else "NULL"
            # 如果是被撤回的消息，标记 is_deleted=1
            is_deleted_val = 1 if str(msg_id).strip() in revoked_prev_ids else 0
            msg_values.append(
                f"('{msg_id}', '{gid}', '{sender_id}', '{sender}', '{msg_type}', {msg_time_val}, '{msg_content}', '{receiver}', {issue_id_val_sql}, {is_deleted_val})"
            )

        msg_count = 0
        if msg_values:
            sql = (
                "INSERT IGNORE INTO grp_msg_raw "
                "(msg_id, group_id, sender_id, sender, msg_type, msg_time, msg_content, receiver, issue_id, is_deleted) "
                "VALUES " + ", ".join(msg_values)
            )
            with conn.cursor() as cur:
                cur.execute(sql)
                msg_count = cur.rowcount
            conn.commit()

        # ── member: INSERT IGNORE ──
        member_values = []
        seen = set()
        for m in batch:
            gid = str(m.get("group_id") or "").strip()
            sender_id = str(m.get("sender_id") or "").strip()  # 拼音ID
            sender_name = str(m.get("sender") or "").strip()   # 原始名称
            if not gid or not sender_id:
                continue
            # 根据拼音ID查找中文名，无匹配则使用原始名称
            member_name = _esc(_get_member_name(sender_id))
            # 使用拼音作为member_id，中文名作为member_name
            key = (gid, sender_id)
            if key in seen:
                continue
            seen.add(key)
            member_values.append(f"('{gid}', '{sender_id}', '{member_name}', 0)")

        member_count = 0
        if member_values:
            sql = (
                "INSERT IGNORE INTO grp_group_member "
                "(group_id, member_id, member_name, is_participant) "
                "VALUES " + ", ".join(member_values)
            )
            with conn.cursor() as cur:
                cur.execute(sql)
                member_count = cur.rowcount
            conn.commit()

        return msg_count, member_count
    finally:
        conn.close()


def _esc(s: str) -> str:
    """转义 SQL 字符串中的单引号和反斜杠"""
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


def _find_revoked_messages(batch: list) -> set:
    """
    识别批次中的撤回标记消息，返回需要被标记为删除的上一条消息的 msg_id 集合。
    规则：同一人的连续消息中，msg_type='revoke' 且内容为空时，表示上一条消息被撤回。
    """
    revoked_prev_ids = set()

    for i, m in enumerate(batch):
        msg_type = str(m.get("msg_type") or "").strip()
        msg_content = str(m.get("msg_content") or "").strip()

        # 判断是否为撤回标记消息：type=revoke 且内容为空
        if msg_type == "revoke" and not msg_content:
            sender = str(m.get("sender") or "").strip()
            group_id = str(m.get("group_id") or "").strip()

            # 向前查找同一群组、同一发送人的上一条消息
            for j in range(i - 1, -1, -1):
                prev = batch[j]
                prev_sender = str(prev.get("sender") or "").strip()
                prev_group = str(prev.get("group_id") or "").strip()

                if prev_sender == sender and prev_group == group_id:
                    prev_msg_id = prev.get("msg_id")
                    if prev_msg_id and str(prev_msg_id).strip():
                        revoked_prev_ids.add(str(prev_msg_id).strip())
                    break

    return revoked_prev_ids
