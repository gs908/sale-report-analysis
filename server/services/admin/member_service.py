"""
成员管理服务
"""
from sqlalchemy.orm import Session

from models import GrpGroupMember
from schemas.admin.group import MemberRecord


def update_member(
    db: Session,
    member_id: int,
    is_participant: bool | None = None,
    member_name: str | None = None,
) -> MemberRecord:
    """更新成员信息"""
    m = db.query(GrpGroupMember).filter(GrpGroupMember.id == member_id).first()
    if not m:
        raise ValueError("成员不存在")
    if is_participant is not None:
        m.is_participant = 1 if is_participant else 0
    if member_name is not None:
        m.member_name = member_name
    db.commit()
    db.refresh(m)
    return MemberRecord(
        id=m.id,
        group_id=m.group_id,
        member_name=m.member_name or "",
        member_id=m.member_id,
        is_participant=bool(m.is_participant),
        created_at=m.created_at,
    )
