"""
人员服务 - Dashboard 页面人员列表
"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import GrpFixedMember, GrpGroupMember, GrpMsgRaw, GrpPersonStats
from schemas.dashboard.personnel import PersonnelRecord, PersonnelListResponse


def get_personnel_list(db: Session) -> PersonnelListResponse:
    """
    获取全量人员属性数据
    数据来源：grp_fixed_member + grp_person_stats + grp_group_member + grp_msg_raw
    """
    # 获取所有固定成员
    fixed_members = db.query(GrpFixedMember).all()
    fixed_names = {m.member_name for m in fixed_members}

    # 获取 grp_person_stats 中的统计（跨群）
    person_stats = {
        s.member_name: s
        for s in db.query(GrpPersonStats).all()
    }

    # 获取每个人的发言情况
    all_members = db.query(
        GrpGroupMember.member_name,
        GrpGroupMember.group_id,
        func.count(GrpMsgRaw.id).label("msg_count")
    ).join(
        GrpMsgRaw,
        GrpMsgRaw.group_id == GrpGroupMember.group_id,
    ).group_by(
        GrpGroupMember.member_name,
        GrpGroupMember.group_id,
    ).all()

    # 按姓名聚合
    person_agg: dict = {}
    for name, gid, msg_count in all_members:
        if name not in person_agg:
            person_agg[name] = {"involved": set(), "speaking": set(), "total": 0}
        person_agg[name]["involved"].add(gid)
        if msg_count > 0:
            person_agg[name]["speaking"].add(gid)
        person_agg[name]["total"] += msg_count

    records = []
    all_names = set(person_agg.keys()) | fixed_names

    for name in all_names:
        agg = person_agg.get(name, {"involved": set(), "speaking": set(), "total": 0})
        stats = person_stats.get(name)

        records.append(PersonnelRecord(
            name=name,
            is_fixed_member=name in fixed_names,
            involved_groups=len(agg["involved"]),
            speaking_groups=len(agg["speaking"]),
            total_messages=agg["total"],
        ))

    return PersonnelListResponse(personnel=records, total=len(records))
