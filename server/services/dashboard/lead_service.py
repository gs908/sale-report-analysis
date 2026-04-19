"""
线索服务 - Dashboard 页面线索列表
"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import GrpLead, GrpGroupInfo
from schemas.dashboard.lead import LeadRecord, LeadListResponse


def get_lead_list(db: Session) -> LeadListResponse:
    """
    获取全量线索列表
    数据来源：crm_lead 表
    group_count 通过关联 grp_group_info 统计
    """
    from models import GrpLead

    leads = db.query(GrpLead).all()
    records = []
    for l in leads:
        # 统计关联群数量
        group_count = db.query(func.count(GrpGroupInfo.id)).filter(
            GrpGroupInfo.lead_id == l.id
        ).scalar() or 0

        records.append(LeadRecord(
            id=l.id,
            lead_name=l.lead_name or "",
            customer_name=l.customer_name or "",
            person=l.person or "",
            is_reported=bool(l.status not in (None, "active")),
            report_status=l.status or "active",
            group_count=group_count,
        ))

    return LeadListResponse(leads=records, total=len(records))
