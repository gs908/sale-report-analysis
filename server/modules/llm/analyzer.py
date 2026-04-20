import logging
import re
import time
from typing import List, Callable

from sqlalchemy.orm import Session

from models.msg_raw import GrpMsgRaw
from models.msg_marked import GrpMsgMarked
from models.group_member import GrpGroupMember
from models.group_info import GrpGroupInfo
from modules.llm.client import analyze_messages_batch

logger = logging.getLogger(__name__)

# 预过滤：纯表态短句黑名单（中文+英文）
_PREFLTER_PATTERNS = [
    r"^[\d五四零一二两三四五六七八九十]+$",  # 纯数字/序号
    r"^(收到|好的|ok|OK|嗯|哦|好|行|okk|收到啦|好的嘞|👍|👌|😊|😂)$",
    r"^(收到收到|好的好的|嗯嗯|好好|行行)$",
]
_pre_blacklist = re.compile("|".join(f"({p})" for p in _PREFLTER_PATTERNS), re.IGNORECASE)


def _is_meaningless(content: str) -> bool:
    """判断消息是否属于无意义表态（≤5字符且命中黑名单）"""
    if not content or len(content.strip()) == 0:
        return True
    s = content.strip()
    if len(s) > 5:
        return False
    return bool(_pre_blacklist.match(s))


def analyze_group_messages(
    db: Session,
    group_id: str,
    progress_callback: Callable[[int, int, str], None] | None = None,
    force: bool = False,
) -> dict:
    """
    Analyze group messages and mark them with tags.

    force=True:  忽略已有标记，强制对所有符合筛选条件的消息重新分析。
    force=False: 跳过已有标记的消息，只分析新增消息（增量模式）。

    progress_callback(batch_index, total_batches, msg) 每完成一批调用一次。

    返回: {total, analyzed, failed, elapsed_seconds, batches}
    """
    t0 = time.time()

    from config.llm import get_llm_config
    cfg = get_llm_config()

    participant_members = (
        db.query(GrpGroupMember.member_name)
        .filter(GrpGroupMember.group_id == group_id, GrpGroupMember.is_participant == 1)
        .all()
    )
    participant_names = {m[0] for m in participant_members}

    messages = (
        db.query(GrpMsgRaw)
        .filter(GrpMsgRaw.group_id == group_id)
        .filter(GrpMsgRaw.is_deleted == 0)  # 排除被撤回删除的消息
        .all()
    )

    to_analyze = [m for m in messages if m.sender not in participant_names]

    already_marked_ids: set[int] = set()
    if not force:
        already_marked_ids = set(
            row[0] for row in db.query(GrpMsgMarked.msg_raw_id).filter(
                GrpMsgMarked.msg_raw_id.in_([m.id for m in to_analyze])
            ).all()
        )

    # ── Step 1: 预过滤 — 无意义消息直接标记，不送 LLM ──
    meaningless = []
    needs_llm = []
    for m in to_analyze:
        if m.id in already_marked_ids:
            continue
        content = m.msg_content or ""
        if _is_meaningless(content):
            meaningless.append(m)
        else:
            needs_llm.append(m)

    # 批量写入预过滤结果
    for m in meaningless:
        db.add(GrpMsgMarked(
            msg_raw_id=m.id,
            tag="无意义",
            reason="预过滤判定：纯表态短句"
        ))
        already_marked_ids.add(m.id)
    if meaningless:
        db.commit()

    total = len(needs_llm)
    analyzed = len(meaningless)

    # 确定 LLM 分批数
    small_threshold = cfg.get("batch", {}).get("small_threshold", 35)
    large_batch_size = cfg.get("batch", {}).get("large_batch_size", 15)
    if total == 0:
        total_batches = 0
    elif total <= small_threshold:
        total_batches = 1
    else:
        total_batches = (total + large_batch_size - 1) // large_batch_size

    if progress_callback:
        progress_callback(0, total_batches, f"预过滤完成：{len(meaningless)} 条直接标记，{total} 条待分析")

    if total == 0:
        elapsed = time.time() - t0
        return {"total": len(needs_llm) + len(meaningless), "analyzed": analyzed, "failed": 0, "elapsed_seconds": round(elapsed, 1), "batches": 0}

    # ── Step 2: 剩余消息送 LLM 分批判断 ──
    if total <= small_threshold:
        batches = [needs_llm]
    else:
        batches = [needs_llm[i:i + large_batch_size] for i in range(0, len(needs_llm), large_batch_size)]

    failed = 0

    for idx, batch in enumerate(batches):
        batch_data = [
            {"id": str(m.id), "sender": m.sender, "text": m.msg_content or "", "time": str(m.msg_time)}
            for m in batch
        ]

        batch_t0 = time.time()
        try:
            results = analyze_messages_batch(batch_data)
            batch_elapsed = time.time() - batch_t0
            for item in results:
                msg_raw_id = int(item.get("id", 0))
                if msg_raw_id in already_marked_ids:
                    continue

                marked = GrpMsgMarked(
                    msg_raw_id=msg_raw_id,
                    tag=item.get("tag", ""),
                    reason=item.get("reason", "")
                )
                db.add(marked)
                already_marked_ids.add(msg_raw_id)
                analyzed += 1

            db.commit()
            msg = f"批次 {idx+1}/{total_batches} 完成：{len(batch)} 条，耗时 {batch_elapsed:.1f}s"
        except Exception as e:
            logger.error(f"Batch {idx+1} analysis failed: {e}")
            db.rollback()
            failed += len(batch)
            msg = f"批次 {idx+1}/{total_batches} 失败：{len(batch)} 条"

        if progress_callback:
            progress_callback(idx + 1, total_batches, msg)

    elapsed = time.time() - t0
    return {
        "total": len(needs_llm) + len(meaningless),
        "analyzed": analyzed,
        "failed": failed,
        "elapsed_seconds": round(elapsed, 1),
        "batches": total_batches,
    }
