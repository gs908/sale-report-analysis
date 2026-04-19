import logging
from typing import Optional

from sqlalchemy.orm import Session

from models.group_info import GrpGroupInfo
from modules.llm.analyzer import analyze_group_messages

logger = logging.getLogger(__name__)


def run_analysis(db: Session, group_id: Optional[str] = None) -> dict:
    """
    Run message analysis on group messages.

    If group_id is provided: analyze single group.
    If group_id is None: analyze all groups with unanalyzed messages.

    Returns analysis summary: {total: N, analyzed: M, failed: F}
    """
    if group_id:
        # 检查指定群是否为活跃状态
        group = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == group_id).first()
        if not group:
            logger.warning(f"Group {group_id} not found")
            return {"total": 0, "analyzed": 0, "failed": 0, "skipped": True, "reason": "not_found"}
        if group.status != "active":
            logger.info(f"Skipping non-active group {group_id}, status={group.status}")
            return {"total": 0, "analyzed": 0, "failed": 0, "skipped": True, "reason": f"status_{group.status}"}
        return analyze_group_messages(db, group_id)

    # 只查询活跃状态的群组
    groups = db.query(GrpGroupInfo.group_id).filter(GrpGroupInfo.status == "active").all()
    overall = {"total": 0, "analyzed": 0, "failed": 0, "skipped_groups": 0}

    logger.info(f"Found {len(groups)} active groups to analyze")

    for (gid,) in groups:
        try:
            result = analyze_group_messages(db, gid)
            overall["total"] += result["total"]
            overall["analyzed"] += result["analyzed"]
            overall["failed"] += result["failed"]
        except Exception as e:
            logger.error(f"Analysis failed for group {gid}: {e}")
            overall["failed"] += 1
            continue

    return overall
