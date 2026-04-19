from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from config.database import Base


class GrpGroupMember(Base):
    __tablename__ = "grp_group_member"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(String(64), ForeignKey("grp_group_info.group_id", ondelete="CASCADE"))
    member_name = Column(String(128))
    member_id = Column(String(64), nullable=True)
    is_participant = Column(Integer, default=0)  # 1=报备参与人
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("group_id", "member_id", name="uq_group_member_id"),
    )
