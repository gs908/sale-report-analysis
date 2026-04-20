"""
分部执行脚本：群消息分析四步流程

用法（从项目根目录运行）：
    python -m server.test.step_by_step

四步流程说明：
    Step 1 - 群消息导入：导入群消息Excel，支持增量/全量入库，自动更新 group_info、group_member
    Step 2 - 标记报备人：基于报备信息或人工标记，在 group_member 中标记参与人 (is_participant=1)
    Step 3 - LLM 分析：筛选条件：未删除、消息类型=text、非语音、非参与人，调用LLM分析并产出 grp_msg_marked
    Step 4 - 统计分析：双维度统计
              - 按群统计：需发言人数、实际发言数量、发言情况分类
              - 按人统计：参与的群数、有发言的群数、有实质建议的群数、发言占比、实质发言占比
"""
import sys
import os
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from config.database import SessionLocal
from models import GrpGroupInfo, GrpMsgRaw, GrpGroupMember
from modules.excel.importer import import_batch

# 机器人账号列表（排除在成员统计之外）
BOT_MEMBER_IDS = {"rxkf01"}


# ─────────────────────────────────────────────
# 配置区
# ─────────────────────────────────────────────
EXCEL_FILE = r"D:\workspaces\agentic-workspace\group-msg-analysis\server\data\售前交流分析群.xlsx"


# ═════════════════════════════════════════════
# Step 1: 群消息导入
# ═════════════════════════════════════════════
def step1_import(full_reset: bool = False):
    """
    导入群消息 Excel 文件

    Args:
        full_reset: True=全量导入（先清空所有表再导入）, False=增量导入（默认）

    自动完成：
    - grp_group_info 更新/创建
    - grp_msg_raw 消息入库（自动处理撤回标记）
    - grp_group_member 成员信息更新（拼音ID映射中文名）
    """
    print("\n" + "=" * 50)
    print("Step 1: 群消息导入")
    print("=" * 50)

    if not os.path.exists(EXCEL_FILE):
        print(f"错误: 文件不存在: {EXCEL_FILE}")
        print("请修改 EXCEL_FILE 配置或使用 --file 参数指定")
        return False

    session = SessionLocal()
    try:
        if full_reset:
            print("\n[!] 全量模式：正在清空所有数据...")
            # 按外键依赖顺序清空
            from models.msg_marked import GrpMsgMarked
            from models.video_stage import GrpVideoStage
            from models.group_msg_stat import GrpGroupMsgStat
            from models.person_stats import GrpPersonStats

            session.query(GrpMsgMarked).delete()
            session.query(GrpVideoStage).delete()
            session.query(GrpGroupMsgStat).delete()
            session.query(GrpPersonStats).delete()
            session.query(GrpGroupMember).delete()
            session.query(GrpMsgRaw).delete()
            session.query(GrpGroupInfo).delete()
            session.commit()
            print("    已清空所有表数据")

        print(f"\n开始导入文件: {EXCEL_FILE}")
        result = import_batch(EXCEL_FILE)

        print(f"\n导入完成:")
        print(f"  - 群组数量: {result.get('group_count', 0)}")
        print(f"  - 消息数量: {result.get('msg_count', 0)} (已处理撤回标记)")
        print(f"  - 成员数量: {result.get('member_count', 0)} (含拼音映射)")

        # 显示导入摘要
        groups = session.query(GrpGroupInfo).all()
        print(f"\n群组摘要:")
        for g in groups[:5]:  # 最多显示5个
            member_count = (
                session.query(GrpGroupMember)
                .filter(GrpGroupMember.group_id == g.group_id)
                .filter(GrpGroupMember.member_id.notin_(BOT_MEMBER_IDS))
                .count()
            )
            msg_count = session.query(GrpMsgRaw).filter(
                GrpMsgRaw.group_id == g.group_id
            ).count()
            print(f"  [{g.group_id[:8]}...] {g.group_name or 'N/A'}")
            print(f"      成员: {member_count} | 消息: {msg_count}")
        if len(groups) > 5:
            print(f"  ... 还有 {len(groups) - 5} 个群组")

        return True
    except Exception as e:
        print(f"导入失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()


# ═════════════════════════════════════════════
# Step 1.1: 自动识别视频阶段
# ═════════════════════════════════════════════
def step1_1_detect_stages(group_id: str = None):
    """
    基于导入的群消息，自动识别视频阶段

    规则：
    1. 识别 msg_type='video' 的消息作为阶段边界
    2. 识别发送人为"融鑫小R"等系统账号的视频链接消息
    3. 每个视频消息创建一个阶段 (stage_index=0,1,2...)
    4. 阶段时间范围：视频发送时间 ~ 下一个视频发送时间

    Args:
        group_id: 指定群组ID，None=处理所有群组
    """
    print("\n" + "=" * 50)
    print("Step 1.1: 自动识别视频阶段")
    print("=" * 50)

    from modules.stage_detector import detect_and_save_stages, detect_all_groups_stages

    session = SessionLocal()
    try:
        if group_id:
            # 单群组处理
            print(f"\n处理群组: {group_id}")
            stages = detect_and_save_stages(session, group_id)
            print(f"  检测到 {len(stages)} 个阶段")
            for s in stages:
                print(f"    Stage {s['stageIndex']}: {s['videoTitle'][:30]}...")
                print(f"      时间: {s['videoPushTime']} ~ {s.get('endTime', '结束')}")
        else:
            # 所有群组
            print("\n处理所有群组...")
            results = detect_all_groups_stages(session)

            total_stages = sum(results.values())
            total_groups = len(results)
            groups_with_video = sum(1 for c in results.values() if c > 1 or c == 1)

            print(f"\n处理完成:")
            print(f"  群组数: {total_groups}")
            print(f"  有视频的群组: {groups_with_video}")
            print(f"  总阶段数: {total_stages}")

            # 显示详情
            print(f"\n详情（前10个）:")
            for idx, (gid, count) in enumerate(list(results.items())[:10]):
                group = session.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == gid).first()
                gname = group.group_name if group else "N/A"
                print(f"  [{gid[:8]}...] {gname[:20]}: {count} 个阶段")

        return True
    except Exception as e:
        print(f"识别失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()


# ═════════════════════════════════════════════
# Step 2: 标记报备人
# ═════════════════════════════════════════════

def _parse_taizhang_file(file_path: str) -> dict:
    """
    解析售前交流台账文件，提取群名称 -> 我方人员列表 映射

    Args:
        file_path: 台账文件路径（Excel）

    Returns:
        {group_name: [member_name1, member_name2, ...], ...}
    """
    import pandas as pd
    import re

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"台账文件不存在: {file_path}")

    print(f"  读取台账文件: {file_path}")
    df = pd.read_excel(file_path)

    # 检查必需字段
    required_cols = ["客户及线索名称", "我方人员姓名"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"台账文件缺少必需字段: {missing_cols}")

    result = {}
    for idx, row in df.iterrows():
        group_name = str(row["客户及线索名称"]).strip() if pd.notna(row["客户及线索名称"]) else ""
        members_str = str(row["我方人员姓名"]).strip() if pd.notna(row["我方人员姓名"]) else ""

        if not group_name or not members_str:
            continue

        # 解析我方人员姓名：支持顿号（、）和逗号（，）分隔
        # 先统一替换顿号为逗号，然后按逗号分割
        members_str_normalized = members_str.replace("、", ",")
        member_names = [m.strip() for m in re.split(r"[,，]", members_str_normalized) if m.strip()]

        if member_names:
            result[group_name] = member_names
            print(f"    [{idx+1}] {group_name[:30]}... -> {member_names}")

    print(f"\n  共解析 {len(result)} 个群组的参与人信息")
    return result


def _match_and_mark_participants(session, taizhang_data: dict) -> dict:
    """
    匹配台账数据与群成员，标记参与人

    Args:
        session: 数据库会话
        taizhang_data: {group_name: [member_name, ...], ...}

    Returns:
        {group_id: marked_count, ...}
    """
    stats = {"total_groups": len(taizhang_data), "matched_groups": 0, "marked_members": 0}

    # 获取所有群组的映射（group_name -> group_id）
    group_mappings = {}
    all_groups = session.query(GrpGroupInfo.group_id, GrpGroupInfo.group_name).all()
    for gid, gname in all_groups:
        if gname:
            # 存储原始名称和简化名称（去掉WT-xxx等）
            group_mappings[gname] = gid
            # 简化名称：去掉 WT-xxxxx 部分
            simplified = re.sub(r"WT-\d+", "", gname).strip()
            if simplified and simplified != gname:
                group_mappings[simplified] = gid

    for tz_group_name, member_names in taizhang_data.items():
        # 尝试匹配群组
        matched_group_id = None

        # 直接匹配
        if tz_group_name in group_mappings:
            matched_group_id = group_mappings[tz_group_name]
        else:
            # 简化名称匹配（去掉WT-xxx）
            tz_simplified = re.sub(r"WT-\d+", "", tz_group_name).strip()
            if tz_simplified in group_mappings:
                matched_group_id = group_mappings[tz_simplified]
            else:
                # 模糊匹配：查找包含关系的
                for gname, gid in group_mappings.items():
                    # 互相包含检查
                    if tz_group_name in gname or gname in tz_group_name:
                        matched_group_id = gid
                        break
                    # 检查简化后的名称
                    if tz_simplified and (tz_simplified in gname or gname in tz_simplified):
                        matched_group_id = gid
                        break

        if not matched_group_id:
            print(f"  [!] 未找到匹配群组: {tz_group_name[:40]}")
            continue

        stats["matched_groups"] += 1
        group = session.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == matched_group_id).first()
        gname = group.group_name if group else "N/A"

        print(f"  [{matched_group_id[:8]}...] {gname[:30]}")
        print(f"    台账人员: {member_names}")

        # 匹配群成员并标记
        group_members = session.query(GrpGroupMember).filter(
            GrpGroupMember.group_id == matched_group_id
        ).all()

        marked = []
        for tz_name in member_names:
            # 尝试匹配成员（精确匹配或包含匹配）
            matched_member = None
            for gm in group_members:
                # 精确匹配 member_name
                if gm.member_name == tz_name:
                    matched_member = gm
                    break
                # 包含匹配（台账姓名在成员名中，或反之）
                if tz_name in gm.member_name or gm.member_name in tz_name:
                    matched_member = gm
                    break
                # 拼音映射匹配（如果台账是中文，成员是拼音映射后的中文）
                # 已经在导入时完成映射，这里直接比较即可

            if matched_member:
                if matched_member.is_participant != 1:
                    matched_member.is_participant = 1
                    marked.append(matched_member.member_name)
                    stats["marked_members"] += 1

        if marked:
            print(f"    标记参与人: {marked}")
        else:
            print(f"    [!] 未匹配到可标记成员")

    return stats


def step2_mark_participants(auto_mode: bool = False, clue_file: str = None):
    """
    在 group_member 中标记参与人 (is_participant=1)

    Args:
        auto_mode: True=从台账文件自动解析, False=打印待标记清单（手动模式）
        clue_file: 台账文件路径（auto_mode=True 时使用），默认使用 server/data/售前交流台账.xlsx

    说明：
    - 参与人标记后，在 LLM 分析和统计中会排除这些用户的发言
    - 台账文件中"我方人员姓名"字段支持顿号（、）和逗号（，）分隔
    """
    print("\n" + "=" * 50)
    print("Step 2: 标记报备人")
    print("=" * 50)

    # 默认台账文件路径
    DEFAULT_TAIZHANG_FILE = r"server/data/售前交流台账.xlsx"

    session = SessionLocal()
    try:
        if auto_mode:
            # 自动模式：从台账文件解析
            file_path = clue_file or DEFAULT_TAIZHANG_FILE

            if not os.path.exists(file_path):
                print(f"\n[!] 台账文件不存在: {file_path}")
                print("  请确认文件路径或手动指定 --clue-file 参数")
                return False

            print(f"\n[自动模式] 从台账文件解析参与人")
            print(f"  文件: {file_path}")

            try:
                # 解析台账文件
                taizhang_data = _parse_taizhang_file(file_path)

                if not taizhang_data:
                    print("  [!] 台账文件未解析到有效数据")
                    return False

                # 匹配并标记
                print(f"\n开始匹配并标记参与人...")
                stats = _match_and_mark_participants(session, taizhang_data)

                session.commit()

                print(f"\n标记完成:")
                print(f"  台账群组数: {stats['total_groups']}")
                print(f"  匹配到群组: {stats['matched_groups']}")
                print(f"  标记参与人: {stats['marked_members']} 人次")

            except Exception as e:
                print(f"  [!] 解析失败: {e}")
                import traceback
                traceback.print_exc()
                return False

        else:
            # 手动模式：列出待标记清单
            print("\n[手动模式] 列出待标记成员清单")

            all_members = (
                session.query(
                    GrpGroupMember.group_id,
                    GrpGroupMember.member_id,
                    GrpGroupMember.member_name,
                    GrpGroupInfo.group_name
                )
                .join(GrpGroupInfo, GrpGroupMember.group_id == GrpGroupInfo.group_id)
                .filter(GrpGroupMember.is_participant == 0)
                .all()
            )

            if not all_members:
                print("没有需要标记的成员")
                return True

            print(f"\n当前共有 {len(all_members)} 个未标记成员:")

            from collections import defaultdict
            group_members = defaultdict(list)

            for m in all_members:
                group_members[m.group_id].append({
                    "member_id": m.member_id,
                    "member_name": m.member_name,
                    "group_name": m.group_name
                })

            print("\n各群待标记成员列表:")
            for gid, members in group_members.items():
                print(f"\n  群组 [{gid[:8]}...] {members[0]['group_name'] or 'N/A'}")
                for m in members:
                    print(f"    - {m['member_name']} ({m['member_id']})")

            print("\n提示: 使用自动模式标记参与人:")
            print(f"  python -m server.test.step_by_step --step 2 --auto")
            print(f"  python -m server.test.step_by_step --step 2 --auto --clue-file <台账文件路径>")

        # 显示当前已标记的参与人
        participants = (
            session.query(
                GrpGroupMember.group_id,
                GrpGroupMember.member_name,
                GrpGroupInfo.group_name
            )
            .join(GrpGroupInfo, GrpGroupMember.group_id == GrpGroupInfo.group_id)
            .filter(GrpGroupMember.is_participant == 1)
            .all()
        )

        if participants:
            print(f"\n当前已标记参与人 ({len(participants)} 个):")
            for p in participants:
                print(f"  [{p.group_id[:8]}...] {p.group_name or 'N/A'} -> {p.member_name}")

        return True
    finally:
        session.close()


# ═════════════════════════════════════════════
# Step 3: LLM 分析
# ═════════════════════════════════════════════
def step3_llm_analysis(force: bool = False, group_id: str = None):
    """
    调用 LLM 分析群消息

    Args:
        force: True=强制重新分析所有消息, False=仅分析未分析的消息（增量）
        group_id: 指定群组ID分析，None=分析所有群组

    筛选条件：
    - is_deleted = 0（未标记删除）
    - msg_type = 'text'（文本消息）
    - 发送人不是参与人（grp_group_member.is_participant=0）
    - 排除语音内容（通过内容特征或 msg_type 子类型判断）

    产出：grp_msg_marked 表记录
    """
    print("\n" + "=" * 50)
    print("Step 3: LLM 消息分析")
    print("=" * 50)

    from config.llm import load_llm_config
    from modules.llm.analyzer import analyze_group_messages
    import time

    load_llm_config()

    session = SessionLocal()
    try:
        # 确定分析范围
        if group_id:
            groups = [(group_id,)]
        else:
            groups = session.query(GrpGroupInfo.group_id).all()

        print(f"\n分析群组数量: {len(groups)}")
        print(f"分析模式: {'强制重分析' if force else '增量分析（仅新消息）'}")
        print(f"筛选条件: is_deleted=0 AND msg_type='text' AND 发送人非参与人")

        total_analyzed = 0
        total_failed = 0
        grand_start = time.time()

        for seq_idx, (gid,) in enumerate(groups, 1):
            print(f"\n[{seq_idx}/{len(groups)}] 分析群组: {gid[:20]}...")

            # 显示该群待分析的消息统计
            stats = _get_analysis_stats(session, gid)
            print(f"    待分析: {stats['to_analyze']} 条")
            print(f"    - 已删除: {stats['deleted']} | 非文本: {stats['non_text']} | 参与人: {stats['participant']}")

            def on_progress(done: int, total_batches: int = 0, msg: str = ""):
                bar_len = 20
                filled = int(bar_len * done / total_batches) if total_batches > 0 else 0
                bar = "=" * filled + "-" * (bar_len - filled)
                print(f"      [{bar}] {done}/{total_batches} {msg}", flush=True)

            t0 = time.time()
            result = analyze_group_messages(
                session, gid, progress_callback=on_progress, force=force
            )
            elapsed = time.time() - t0

            analyzed = result.get("analyzed", 0)
            failed = result.get("failed", 0)
            batches = result.get("batches", 0)
            total_analyzed += analyzed
            total_failed += failed

            print(f"    完成: {analyzed} 条分析, {failed} 条失败, {batches} 批次, 耗时 {elapsed:.1f}s")

        grand_elapsed = time.time() - grand_start

        # 显示分析结果摘要
        marked_summary = _get_marked_summary(session)
        print("\n" + "=" * 50)
        print("LLM 分析完成")
        print("=" * 50)
        print(f"  总耗时: {grand_elapsed:.1f}s")
        print(f"  总分析: {total_analyzed} 条（成功）, {total_failed} 条（失败）")
        print(f"\n标记分布:")
        for tag, count in marked_summary.items():
            print(f"  - {tag}: {count} 条")

        return True
    except Exception as e:
        print(f"分析失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()


def _get_analysis_stats(session, group_id: str) -> dict:
    """获取某群组的分析统计"""
    from sqlalchemy import func
    from models.msg_marked import GrpMsgMarked

    # 总消息数
    total = session.query(func.count(GrpMsgRaw.id)).filter(
        GrpMsgRaw.group_id == group_id
    ).scalar() or 0

    # 已删除
    deleted = session.query(func.count(GrpMsgRaw.id)).filter(
        GrpMsgRaw.group_id == group_id,
        GrpMsgRaw.is_deleted == 1
    ).scalar() or 0

    # 非文本类型
    non_text = session.query(func.count(GrpMsgRaw.id)).filter(
        GrpMsgRaw.group_id == group_id,
        GrpMsgRaw.msg_type != 'text'
    ).scalar() or 0

    # 参与人发送的消息
    participant = (
        session.query(func.count(GrpMsgRaw.id))
        .join(GrpGroupMember, (GrpGroupMember.group_id == GrpMsgRaw.group_id)
              & (GrpGroupMember.member_name == GrpMsgRaw.sender))
        .filter(GrpMsgRaw.group_id == group_id, GrpGroupMember.is_participant == 1)
        .scalar() or 0
    )

    # 已分析的消息
    analyzed = (
        session.query(func.count(GrpMsgMarked.id))
        .join(GrpMsgRaw, GrpMsgRaw.id == GrpMsgMarked.msg_raw_id)
        .filter(GrpMsgRaw.group_id == group_id)
        .scalar() or 0
    )

    # 待分析 = 总数 - 已删除 - 非文本 - 参与人 - 已分析
    to_analyze = total - deleted - non_text - participant - analyzed

    return {
        "total": total,
        "deleted": deleted,
        "non_text": non_text,
        "participant": participant,
        "analyzed": analyzed,
        "to_analyze": max(0, to_analyze)
    }


def _get_marked_summary(session):
    """获取标记分布统计"""
    from sqlalchemy import func
    from models.msg_marked import GrpMsgMarked

    results = (
        session.query(GrpMsgMarked.tag, func.count(GrpMsgMarked.id))
        .group_by(GrpMsgMarked.tag)
        .all()
    )
    return {tag: count for tag, count in results}


# ═════════════════════════════════════════════
# Step 4: 统计分析
# ═════════════════════════════════════════════
def step4_statistics():
    """
    双维度统计分析

    维度 1 - 按群统计：
    - 需发言人数（群成员中非参与人数量）
    - 实际发言数量（按人统计，有发言即计数）
    - 发言情况分类：无意义条数、有实质建议条数

    维度 2 - 按人统计：
    - 参与的群数
    - 有发言的群数
    - 有实质建议的群数
    - 发言占比 = 有发言的群数 / 参与的群数
    - 实质发言占比 = 有实质建议的群数 / 参与的群数
    - 实质发言消息总数
    """
    print("\n" + "=" * 50)
    print("Step 4: 统计分析")
    print("=" * 50)

    session = SessionLocal()
    try:
        from sqlalchemy import func, distinct
        from models.msg_marked import GrpMsgMarked
        from models.group_msg_stat import GrpGroupMsgStat
        from models.person_stats import GrpPersonStats

        # ═══════════════════════════════════════
        # 维度 1: 按群统计
        # ═══════════════════════════════════════
        print("\n【维度 1: 按群统计】")
        print("-" * 40)

        groups = session.query(GrpGroupInfo).all()

        for group in groups:
            gid = group.group_id
            gname = group.group_name or "N/A"

            # 需发言人数（群成员中非参与人）
            required_speakers = (
                session.query(func.count(GrpGroupMember.id))
                .filter(GrpGroupMember.group_id == gid, GrpGroupMember.is_participant == 0)
                .scalar() or 0
            )

            # 实际发言人数（有消息记录的非参与人）
            actual_speakers = (
                session.query(func.count(distinct(GrpMsgRaw.sender)))
                .join(GrpGroupMember, (GrpGroupMember.group_id == GrpMsgRaw.group_id)
                      & (GrpGroupMember.member_name == GrpMsgRaw.sender))
                .filter(GrpMsgRaw.group_id == gid, GrpGroupMember.is_participant == 0)
                .scalar() or 0
            )

            # 发言分类统计
            speech_stats = (
                session.query(GrpMsgMarked.tag, func.count(GrpMsgMarked.id))
                .join(GrpMsgRaw, GrpMsgRaw.id == GrpMsgMarked.msg_raw_id)
                .join(GrpGroupMember, (GrpGroupMember.group_id == GrpMsgRaw.group_id)
                      & (GrpGroupMember.member_name == GrpMsgRaw.sender))
                .filter(GrpMsgRaw.group_id == gid, GrpGroupMember.is_participant == 0)
                .group_by(GrpMsgMarked.tag)
                .all()
            )

            speech_counts = {tag: count for tag, count in speech_stats}
            meaningless = speech_counts.get("无意义", 0)
            meaningful = speech_counts.get("有实质建议", 0)
            other = sum(c for t, c in speech_counts.items() if t not in ["无意义", "有实质建议"])

            # 保存到统计表
            _save_group_stats(session, gid, required_speakers, actual_speakers, meaningful)

            print(f"\n  群组 [{gid[:8]}...] {gname}")
            print(f"    需发言人数: {required_speakers}")
            print(f"    实际发言: {actual_speakers} 人")
            print(f"    发言情况:")
            print(f"      - 有实质建议: {meaningful} 条")
            print(f"      - 无意义: {meaningless} 条")
            print(f"      - 其他/未分类: {other} 条")

        # ═══════════════════════════════════════
        # 维度 2: 按人统计
        # ═══════════════════════════════════════
        print("\n\n【维度 2: 按人统计】")
        print("-" * 40)

        # 获取所有非参与人成员
        all_members = (
            session.query(
                GrpGroupMember.member_name,
                func.count(distinct(GrpGroupMember.group_id)).label("total_groups")
            )
            .filter(GrpGroupMember.is_participant == 0)
            .group_by(GrpGroupMember.member_name)
            .all()
        )

        for member_name, total_groups in all_members:
            # 该成员参与的所有群组
            member_groups = (
                session.query(GrpGroupMember.group_id)
                .filter(GrpGroupMember.member_name == member_name, GrpGroupMember.is_participant == 0)
                .all()
            )
            group_ids = [g[0] for g in member_groups]

            # 有发言的群数（该成员在这些群中有消息记录）
            groups_with_speech = (
                session.query(func.count(distinct(GrpMsgRaw.group_id)))
                .filter(GrpMsgRaw.sender == member_name, GrpMsgRaw.group_id.in_(group_ids))
                .scalar() or 0
            )

            # 有实质建议的群数（该成员在这些群中有"有实质建议"的标记）
            groups_with_meaningful = (
                session.query(func.count(distinct(GrpMsgRaw.group_id)))
                .join(GrpMsgMarked, GrpMsgMarked.msg_raw_id == GrpMsgRaw.id)
                .filter(GrpMsgRaw.sender == member_name,
                        GrpMsgRaw.group_id.in_(group_ids),
                        GrpMsgMarked.tag == "有实质建议")
                .scalar() or 0
            )

            # 实质发言消息总数
            total_meaningful_messages = (
                session.query(func.count(GrpMsgMarked.id))
                .join(GrpMsgRaw, GrpMsgMarked.msg_raw_id == GrpMsgRaw.id)
                .filter(GrpMsgRaw.sender == member_name,
                        GrpMsgRaw.group_id.in_(group_ids),
                        GrpMsgMarked.tag == "有实质建议")
                .scalar() or 0
            )

            # 计算占比（按群数统计，非消息数）
            speech_rate = groups_with_speech / total_groups * 100 if total_groups > 0 else 0
            meaningful_rate = groups_with_meaningful / total_groups * 100 if total_groups > 0 else 0

            # 保存到统计表
            _save_person_stats(session, member_name, total_groups, groups_with_speech,
                               groups_with_meaningful, total_meaningful_messages)

            print(f"\n  {member_name}:")
            print(f"    参与群数: {total_groups}")
            print(f"    有发言群数: {groups_with_speech} ({speech_rate:.1f}%)")
            print(f"    有实质建议群数: {groups_with_meaningful} ({meaningful_rate:.1f}%)")
            print(f"    实质发言消息总数: {total_meaningful_messages}")

        session.commit()

        # 统计保存记录数
        group_stats_count = session.query(GrpGroupMsgStat).count()
        person_stats_count = session.query(GrpPersonStats).count()

        print("\n" + "=" * 50)
        print("统计完成")
        print("=" * 50)
        print(f"  grp_group_msg_stat (按群): {group_stats_count} 条记录")
        print(f"  grp_person_stats (按人):   {person_stats_count} 条记录")

        return True
    except Exception as e:
        print(f"统计失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()


def _save_group_stats(session, group_id: str, required: int, actual: int, valid: int):
    """保存群组统计结果到 grp_group_msg_stat 表"""
    from models.group_msg_stat import GrpGroupMsgStat

    existing = session.query(GrpGroupMsgStat).filter(
        GrpGroupMsgStat.group_id == group_id,
        GrpGroupMsgStat.participant_name.is_(None)  # 群组级统计
    ).first()

    if existing:
        existing.total_replies = required
        existing.valid_replies = valid
    else:
        session.add(GrpGroupMsgStat(
            group_id=group_id,
            participant_name=None,
            total_replies=required,
            valid_replies=valid
        ))


def _save_person_stats(session, person_name: str, total_groups: int, groups_with_speech: int,
                       groups_meaningful: int, total_meaningful: int):
    """保存个人统计结果到 grp_person_stats 表"""
    from models.person_stats import GrpPersonStats

    # 计算占比（百分比整数存储）
    speech_rate = int(groups_with_speech / total_groups * 100) if total_groups > 0 else 0
    meaningful_rate = int(groups_meaningful / total_groups * 100) if total_groups > 0 else 0

    # 查找是否已有记录
    existing = session.query(GrpPersonStats).filter(
        GrpPersonStats.member_name == person_name
    ).first()

    if existing:
        # 更新现有记录
        existing.total_groups = total_groups
        existing.groups_with_speech = groups_with_speech
        existing.groups_with_meaningful = groups_meaningful
        existing.speech_rate = speech_rate
        existing.meaningful_rate = meaningful_rate
        existing.total_meaningful_messages = total_meaningful
    else:
        # 创建新记录
        session.add(GrpPersonStats(
            member_name=person_name,
            total_groups=total_groups,
            groups_with_speech=groups_with_speech,
            groups_with_meaningful=groups_meaningful,
            speech_rate=speech_rate,
            meaningful_rate=meaningful_rate,
            total_meaningful_messages=total_meaningful
        ))


# ═════════════════════════════════════════════
# 辅助功能
# ═════════════════════════════════════════════
def show_db_status():
    """显示数据库当前状态"""
    print("\n" + "=" * 50)
    print("数据库当前状态")
    print("=" * 50)

    session = SessionLocal()
    try:
        from models.msg_marked import GrpMsgMarked
        from models.video_stage import GrpVideoStage
        from models.group_msg_stat import GrpGroupMsgStat
        from models.person_stats import GrpPersonStats

        g = session.query(GrpGroupInfo).count()
        m = session.query(GrpMsgRaw).count()
        d = session.query(GrpMsgRaw).filter(GrpMsgRaw.is_deleted == 1).count()
        c = session.query(GrpGroupMember).count()
        p = session.query(GrpGroupMember).filter(GrpGroupMember.is_participant == 1).count()
        a = session.query(GrpMsgMarked).count()
        v = session.query(GrpVideoStage).count()
        s = session.query(GrpGroupMsgStat).count()
        ps = session.query(GrpPersonStats).count()

        print(f"\n  grp_group_info:     {g} 条")
        print(f"  grp_msg_raw:        {m} 条 (已删除: {d} 条)")
        print(f"  grp_group_member:   {c} 条 (参与人: {p} 条)")
        print(f"  grp_msg_marked:     {a} 条 (LLM分析结果)")
        print(f"  grp_video_stage:    {v} 条 (视频阶段)")
        print(f"  grp_group_msg_stat: {s} 条 (按群统计)")
        print(f"  grp_person_stats:   {ps} 条 (按人统计)")
    finally:
        session.close()


def show_help():
    """显示帮助信息"""
    print("""
用法: python -m server.test.step_by_step [选项]

步骤命令:
  --step 1 [--full-reset]          # 群消息导入（--full-reset 清空后全量导入）
  --step 1.1 [--group ID]          # 识别视频阶段（自动从 msg_type=video 识别）
  --step 2 [--auto --clue-file X]  # 标记报备人（--auto 自动从报备文件解析）
  --step 3 [--force] [--group ID]  # LLM分析（--force 强制重分析）
  --step 4                         # 统计分析（按群+按人双维度）

其他命令:
  --status                         # 查看数据库状态
  --file <path>                    # 指定 Excel 文件路径
  -h, --help                       # 显示帮助

示例:
  python -m server.test.step_by_step --step 1
  python -m server.test.step_by_step --step 1 --full-reset
  python -m server.test.step_by_step --step 1.1              # 识别所有群视频阶段
  python -m server.test.step_by_step --step 1.1 --group XXX  # 识别单个群视频阶段
  python -m server.test.step_by_step --file ./data.xlsx --step 3 --force
  python -m server.test.step_by_step --step 4
    """)


# ═════════════════════════════════════════════
# 入口
# ═════════════════════════════════════════════
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="群消息分析四步流程", add_help=False)
    parser.add_argument("--step", type=str,
                        choices=["1", "1.1", "2", "3", "4"],
                        help="执行指定步骤 (1, 1.1, 2, 3, 4)")
    parser.add_argument("--status", action="store_true",
                        help="查看数据库当前状态")
    parser.add_argument("--help", "-h", action="store_true",
                        help="显示帮助")
    parser.add_argument("--file", type=str,
                        help="指定 Excel 文件路径")

    # Step 1 参数
    parser.add_argument("--full-reset", action="store_true",
                        help="步骤1: 清空所有数据后全量导入")

    # Step 1.1 / 3 共用参数
    parser.add_argument("--group", type=str, dest="group_id",
                        help="步骤1.1/3: 仅处理指定群组")

    # Step 2 参数
    parser.add_argument("--auto", action="store_true",
                        help="步骤2: 自动模式从报备文件解析")
    parser.add_argument("--clue-file", type=str,
                        help="步骤2: 报备信息文件路径")

    # Step 3 参数
    parser.add_argument("--force", action="store_true",
                        help="步骤3: 强制重新分析所有消息")

    args = parser.parse_args()

    if args.help or (not args.step and not args.status):
        show_help()
        sys.exit(0)

    if args.file:
        EXCEL_FILE = args.file

    if args.status:
        show_db_status()
    elif args.step == "1":
        step1_import(full_reset=args.full_reset)
    elif args.step == "1.1":
        step1_1_detect_stages(group_id=args.group_id)
    elif args.step == "2":
        step2_mark_participants(auto_mode=args.auto, clue_file=args.clue_file)
    elif args.step == "3":
        step3_llm_analysis(force=args.force, group_id=args.group_id)
    elif args.step == "4":
        step4_statistics()
