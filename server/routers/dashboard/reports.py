"""
Dashboard - 报备接口
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.database import get_db
from services.dashboard.report_service import get_report_list

router = APIRouter(prefix="/api/dashboard/reports", tags=["Dashboard-报备"])


@router.get("")
def list_reports(
    current: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = get_report_list(db, current, size)
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
