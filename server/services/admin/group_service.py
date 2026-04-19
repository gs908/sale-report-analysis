"""
群组管理服务
"""
from sqlalchemy.orm import Session

from models import GrpGroupInfo, GrpGroupMember
from schemas.admin.group import GroupRecord, MemberRecord, CreateGroupRequest, UpdateGroupRequest
from schemas.common import PageResult


def list_groups(db: Session, current: int = 1, size: int = 20) -> PageResult:
    """获取群列表，含成员信息（分页）"""
    total = db.query(GrpGroupInfo).count()
    offset = (current - 1) * size
    groups = db.query(GrpGroupInfo).order_by(GrpGroupInfo.created_at.desc()).offset(offset).limit(size).all()

    result = []
    for g in groups:
        members = db.query(GrpGroupMember).filter(
            GrpGroupMember.group_id == g.group_id
        ).all()
        member_records = [
            MemberRecord(
                id=m.id,
                group_id=m.group_id,
                member_name=m.member_name or "",
                member_id=m.member_id,
                is_participant=bool(m.is_participant),
                created_at=m.created_at,
            )
            for m in members
        ]
        result.append(GroupRecord(
            id=g.group_id,
            archive_id=g.archive_id,
            name=g.group_name or "",
            lead_id=g.lead_id,
            lead_name=g.lead_name,
            status=g.status or "active",
            created_at=g.created_at,
            dissolved_at=g.dissolved_at,
            members=member_records,
        ))
    return PageResult(total=total, current=current, size=size, list=[r.model_dump() for r in result])


def create_group(db: Session, req: CreateGroupRequest) -> GroupRecord:
    """创建群组"""
    existing = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == req.group_id).first()
    if existing:
        raise ValueError("群ID已存在")
    g = GrpGroupInfo(
        group_id=req.group_id,
        archive_id=req.archive_id,
        group_name=req.group_name,
        lead_id=req.lead_id,
        lead_name=req.lead_name,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return GroupRecord(
        id=g.group_id,
        archive_id=g.archive_id,
        name=g.group_name or "",
        lead_id=g.lead_id,
        lead_name=g.lead_name,
        status=g.status or "active",
        created_at=g.created_at,
        dissolved_at=g.dissolved_at,
        members=[],
    )


def update_group(db: Session, group_id: str, req: UpdateGroupRequest) -> GroupRecord:
    """更新群组信息"""
    g = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == group_id).first()
    if not g:
        raise ValueError("群不存在")
    if req.archive_id is not None:
        g.archive_id = req.archive_id
    if req.group_name is not None:
        g.group_name = req.group_name
    if req.lead_id is not None:
        g.lead_id = req.lead_id
    if req.lead_name is not None:
        g.lead_name = req.lead_name
    if req.status is not None:
        g.status = req.status
        if req.status == "dissolved":
            from datetime import datetime
            g.dissolved_at = datetime.now()
    db.commit()
    db.refresh(g)

    members = db.query(GrpGroupMember).filter(
        GrpGroupMember.group_id == g.group_id
    ).all()
    member_records = [
        MemberRecord(
            id=m.id,
            group_id=m.group_id,
            member_name=m.member_name or "",
            member_id=m.member_id,
            is_participant=bool(m.is_participant),
            created_at=m.created_at,
        )
        for m in members
    ]
    return GroupRecord(
        id=g.group_id,
        archive_id=g.archive_id,
        name=g.group_name or "",
        lead_id=g.lead_id,
        lead_name=g.lead_name,
        status=g.status or "active",
        created_at=g.created_at,
        dissolved_at=g.dissolved_at,
        members=member_records,
    )


def dissolve_group(db: Session, group_id: str) -> None:
    """解散群"""
    g = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == group_id).first()
    if not g:
        raise ValueError("群不存在")
    g.status = "dissolved"
    from datetime import datetime
    g.dissolved_at = datetime.now()
    db.commit()
