"""
Admin - 固定成员管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config.database import get_db
from schemas.admin.fixed_member import FixedMemberRecord, CreateFixedMemberRequest, UpdateFixedMemberRequest
from services.admin.fixed_member_service import (
    list_fixed_members,
    create_fixed_member,
    update_fixed_member,
    delete_fixed_member,
)

router = APIRouter(prefix="/api/admin/fixed-members", tags=["Admin-固定成员管理"])


@router.get("")
def get_fixed_members(
    current: int = Query(1, ge=1, alias="current"),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = list_fixed_members(db, current, size)
    return {
        "code": 0,
        "data": {
            "total": result.total,
            "current": result.current,
            "size": result.size,
            "list": result.list
        },
        "msg": ""
    }


@router.post("")
def add_fixed_member(body: CreateFixedMemberRequest, db: Session = Depends(get_db)):
    m = create_fixed_member(db, body)
    return {"code": 0, "data": m.model_dump(), "msg": ""}


@router.put("/{member_id}")
def modify_fixed_member(member_id: int, body: UpdateFixedMemberRequest, db: Session = Depends(get_db)):
    try:
        m = update_fixed_member(db, member_id, body)
        return {"code": 0, "data": m.model_dump(), "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{member_id}")
def remove_fixed_member(member_id: int, db: Session = Depends(get_db)):
    try:
        delete_fixed_member(db, member_id)
        return {"code": 0, "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
