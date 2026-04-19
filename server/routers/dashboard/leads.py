"""
Dashboard - 线索接口
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from services.dashboard.lead_service import get_lead_list

router = APIRouter(prefix="/api/dashboard/leads", tags=["Dashboard-线索"])


@router.get("")
def list_leads(db: Session = Depends(get_db)):
    result = get_lead_list(db)
    return {"code": 0, "data": {"leads": [r.model_dump() for r in result.leads], "total": result.total}, "msg": ""}
