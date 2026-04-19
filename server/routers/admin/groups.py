"""
Admin - 群组管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config.database import get_db
from schemas.admin.group import CreateGroupRequest, UpdateGroupRequest
from services.admin.group_service import list_groups, create_group, update_group, dissolve_group

router = APIRouter(prefix="/api/admin/groups", tags=["Admin-群组管理"])


@router.get("")
def get_groups(
    current: int = Query(1, ge=1, alias="current"),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = list_groups(db, current, size)
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
def add_group(body: CreateGroupRequest, db: Session = Depends(get_db)):
    try:
        g = create_group(db, body)
        return {"code": 0, "data": g.model_dump(), "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{group_id}")
def modify_group(group_id: str, body: UpdateGroupRequest, db: Session = Depends(get_db)):
    try:
        g = update_group(db, group_id, body)
        return {"code": 0, "data": g.model_dump(), "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{group_id}/dissolve")
def dissolve(group_id: str, db: Session = Depends(get_db)):
    try:
        dissolve_group(db, group_id)
        return {"code": 0, "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
