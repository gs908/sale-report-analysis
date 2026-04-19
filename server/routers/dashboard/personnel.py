"""
Dashboard - 人员接口
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from services.dashboard.personnel_service import get_personnel_list

router = APIRouter(prefix="/api/dashboard/personnel", tags=["Dashboard-人员"])


@router.get("")
def list_personnel(db: Session = Depends(get_db)):
    result = get_personnel_list(db)
    return {"code": 0, "data": {"personnel": [r.model_dump() for r in result.personnel], "total": result.total}, "msg": ""}
