from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from config.database import Base


class GrpReport(Base):
    __tablename__ = "crm_report"

    id = Column(String(64), primary_key=True)
    lead_id = Column(String(64))
    lead_name = Column(String(255))
    customer_name = Column(String(255))
    person = Column(String(128))
    is_reported = Column(Integer, default=0)
    is_returned = Column(Integer, default=0)
    processing_status = Column(String(64))
    is_video_generated = Column(Integer, default=0)
    is_group_created = Column(Integer, default=0)
    remark = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
