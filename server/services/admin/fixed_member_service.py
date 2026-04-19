"""
固定成员服务
"""
from sqlalchemy.orm import Session

from models import GrpFixedMember
from schemas.admin.fixed_member import FixedMemberRecord, CreateFixedMemberRequest, UpdateFixedMemberRequest
from schemas.common import PageResult


def list_fixed_members(db: Session, current: int = 1, size: int = 20) -> PageResult:
    """获取固定成员（分页）"""
    total = db.query(GrpFixedMember).count()
    offset = (current - 1) * size
    members = db.query(GrpFixedMember).offset(offset).limit(size).all()
    return PageResult(
        total=total,
        current=current,
        size=size,
        list=[
            FixedMemberRecord(
                id=m.id,
                member_id=m.member_id,
                member_name=m.member_name,
                is_fixed=bool(m.is_fixed),
                remark=m.remark or "",
                created_at=m.created_at,
                updated_at=m.updated_at,
            ).model_dump()
            for m in members
        ]
    )


def create_fixed_member(db: Session, req: CreateFixedMemberRequest) -> FixedMemberRecord:
    """新增固定成员"""
    m = GrpFixedMember(
        member_id=req.memberId,
        member_name=req.memberName,
        is_fixed=1,
        remark=req.remark,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return FixedMemberRecord(
        id=m.id,
        member_id=m.member_id,
        member_name=m.member_name,
        is_fixed=bool(m.is_fixed),
        remark=m.remark or "",
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def update_fixed_member(db: Session, member_id: int, req: UpdateFixedMemberRequest) -> FixedMemberRecord:
    """更新固定成员"""
    m = db.query(GrpFixedMember).filter(GrpFixedMember.id == member_id).first()
    if not m:
        raise ValueError("固定成员不存在")
    if req.memberName is not None:
        m.member_name = req.memberName
    if req.isFixed is not None:
        m.is_fixed = 1 if req.isFixed else 0
    if req.remark is not None:
        m.remark = req.remark
    db.commit()
    db.refresh(m)
    return FixedMemberRecord(
        id=m.id,
        member_id=m.member_id,
        member_name=m.member_name,
        is_fixed=bool(m.is_fixed),
        remark=m.remark or "",
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def delete_fixed_member(db: Session, member_id: int) -> None:
    """删除固定成员"""
    m = db.query(GrpFixedMember).filter(GrpFixedMember.id == member_id).first()
    if not m:
        raise ValueError("固定成员不存在")
    db.delete(m)
    db.commit()
