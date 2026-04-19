from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from config.database import Base


class GrpFixedMember(Base):
    __tablename__ = "grp_fixed_member"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_id = Column(String(64))
    member_name = Column(String(128), nullable=False)
    is_fixed = Column(Integer, default=1)
    remark = Column(String(512))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
