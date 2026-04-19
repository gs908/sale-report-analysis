"""
报备服务 - 报备列表
"""
from datetime import datetime
from sqlalchemy.orm import Session

from models import GrpReport
from schemas.dashboard.report import ReportRecord
from schemas.common import PageResult


def get_report_list(db: Session, current: int = 1, size: int = 20) -> PageResult:
    """
    获取报备信息列表（分页）
    数据来源：crm_report 表
    """
    query = db.query(GrpReport)
    total = query.count()
    offset = (current - 1) * size
    reports = query.order_by(GrpReport.id.desc()).offset(offset).limit(size).all()

    records = [
        ReportRecord(
            id=r.id,
            lead_name=r.lead_name or "",
            customer_name=r.customer_name or "",
            person=r.person or "",
            is_reported=bool(r.is_reported),
            is_returned=bool(r.is_returned),
            processing_status=r.processing_status or "",
            is_video_generated=bool(r.is_video_generated),
            is_group_created=bool(r.is_group_created),
            remark=r.remark or "",
        ).model_dump()
        for r in reports
    ]
    return PageResult(total=total, current=current, size=size, list=records)


def create_report_record(db: Session, body) -> dict:
    """创建报备记录"""
    import uuid
    report = GrpReport(
        id=str(uuid.uuid4()),
        lead_name=body.leadName,
        customer_name=body.customerName,
        person=body.person,
        is_reported=1 if body.isReported else 0,
        is_returned=1 if body.isReturned else 0,
        processing_status=body.processingStatus,
        is_video_generated=1 if body.isVideoGenerated else 0,
        is_group_created=1 if body.isGroupCreated else 0,
        remark=body.remark,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report_to_dict(report)


def update_report_record(db: Session, report_id: str, body) -> dict:
    """更新报备记录"""
    report = db.query(GrpReport).filter(GrpReport.id == report_id).first()
    if not report:
        raise ValueError("报备记录不存在")
    if body.leadName is not None:
        report.lead_name = body.leadName
    if body.customerName is not None:
        report.customer_name = body.customerName
    if body.person is not None:
        report.person = body.person
    if body.isReported is not None:
        report.is_reported = 1 if body.isReported else 0
    if body.isReturned is not None:
        report.is_returned = 1 if body.isReturned else 0
    if body.processingStatus is not None:
        report.processing_status = body.processingStatus
    if body.isVideoGenerated is not None:
        report.is_video_generated = 1 if body.isVideoGenerated else 0
    if body.isGroupCreated is not None:
        report.is_group_created = 1 if body.isGroupCreated else 0
    if body.remark is not None:
        report.remark = body.remark
    report.updated_at = datetime.now()
    db.commit()
    db.refresh(report)
    return report_to_dict(report)


def delete_report_record(db: Session, report_id: str) -> None:
    """删除报备记录"""
    report = db.query(GrpReport).filter(GrpReport.id == report_id).first()
    if not report:
        raise ValueError("报备记录不存在")
    db.delete(report)
    db.commit()


def report_to_dict(r: GrpReport) -> dict:
    return {
        "id": r.id,
        "leadName": r.lead_name or "",
        "customerName": r.customer_name or "",
        "person": r.person or "",
        "isReported": bool(r.is_reported),
        "isReturned": bool(r.is_returned),
        "processingStatus": r.processing_status or "",
        "isVideoGenerated": bool(r.is_video_generated),
        "isGroupCreated": bool(r.is_group_created),
        "remark": r.remark or "",
    }
