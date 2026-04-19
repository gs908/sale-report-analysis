"""
Admin - 群消息管理接口
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.database import get_db
from services.dashboard.message_group_service import get_message_group_list

router = APIRouter(prefix="/api/admin/message-groups", tags=["Admin-群消息管理"])


@router.get("")
def list_message_groups(
    current: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = get_message_group_list(db, current, size)
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
