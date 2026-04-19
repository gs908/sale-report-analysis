from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from config.database import Base


class GrpLead(Base):
    __tablename__ = "crm_lead"

    id = Column(String(64), primary_key=True)
    lead_name = Column(String(255), nullable=False)
    customer_name = Column(String(255))
    person = Column(String(128))
    status = Column(String(32), default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
