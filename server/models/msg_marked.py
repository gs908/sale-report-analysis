from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from config.database import Base


class GrpMsgMarked(Base):
    __tablename__ = "grp_msg_marked"

    id = Column(Integer, primary_key=True, autoincrement=True)
    msg_raw_id = Column(Integer, ForeignKey("grp_msg_raw.id", ondelete="CASCADE"), unique=True, nullable=False)  # 一对一
    tag = Column(String(64))  # 标签
    reason = Column(String(512))  # 判定原因
    created_at = Column(DateTime, default=func.now())
