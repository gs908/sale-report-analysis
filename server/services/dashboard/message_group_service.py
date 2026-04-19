"""
群消息服务 - Dashboard 页面已接入消息管理的群列表
"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import GrpGroupInfo, GrpMsgRaw
from schemas.dashboard.message_group import MsgGroup
from schemas.common import PageResult


def get_message_group_list(db: Session, current: int = 1, size: int = 20) -> PageResult:
    """
    获取已接入消息管理的群列表（分页）
    数据来源：grp_group_info + grp_msg_raw（按最后活跃时间和消息数排序）
    """
    # 获取每个群的消息数量和最后活跃时间
    group_stats = db.query(
        GrpMsgRaw.group_id,
        func.count(GrpMsgRaw.id).label("msg_count"),
        func.max(GrpMsgRaw.msg_time).label("last_active"),
    ).group_by(GrpMsgRaw.group_id).all()

    stats_map = {g.group_id: {"msg_count": g.msg_count, "last_active": g.last_active} for g in group_stats}

    # 获取群基础信息（带消息的群）
    query = db.query(GrpGroupInfo).filter(
        GrpGroupInfo.group_id.in_(list(stats_map.keys()))
    )

    total = query.count()
    offset = (current - 1) * size
    groups = query.order_by(GrpGroupInfo.created_at.desc()).offset(offset).limit(size).all()

    records = []
    for g in groups:
        stat = stats_map.get(g.group_id, {"msg_count": 0, "last_active": None})
        records.append(MsgGroup(
            id=g.group_id,
            name=g.group_name or "",
            lead_name=g.lead_name or "",
            msg_count=stat["msg_count"],
            last_active=stat["last_active"],
        ).model_dump())

    return PageResult(total=total, current=current, size=size, list=records)
