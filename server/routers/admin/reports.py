"""
Admin - 报备管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config.database import get_db
from pydantic import BaseModel
from services.dashboard.report_service import get_report_list, create_report_record, update_report_record, delete_report_record

router = APIRouter(prefix="/api/admin/reports", tags=["Admin-报备管理"])


class ReportRequest(BaseModel):
    leadName: str | None = None
    customerName: str | None = None
    person: str | None = None
    isReported: bool | None = None
    isReturned: bool | None = None
    processingStatus: str | None = None
    isVideoGenerated: bool | None = None
    isGroupCreated: bool | None = None
    remark: str | None = None


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


@router.post("")
def add_report(body: ReportRequest, db: Session = Depends(get_db)):
    try:
        r = create_report_record(db, body)
        return {"code": 0, "data": r, "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{report_id}")
def modify_report(report_id: str, body: ReportRequest, db: Session = Depends(get_db)):
    try:
        r = update_report_record(db, report_id, body)
        return {"code": 0, "data": r, "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{report_id}")
def remove_report(report_id: str, db: Session = Depends(get_db)):
    try:
        delete_report_record(db, report_id)
        return {"code": 0, "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
