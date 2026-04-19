from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from config.database import Base


class GrpMsgRaw(Base):
    __tablename__ = "grp_msg_raw"

    id = Column(Integer, primary_key=True, autoincrement=True)
    msg_id = Column(String(64), unique=True, nullable=False)  # 消息原生ID
    group_id = Column(String(64), ForeignKey("grp_group_info.group_id", ondelete="CASCADE"))
    sender_id = Column(String(64))
    sender = Column(String(128))  # 发送人姓名
    msg_type = Column(String(32))
    msg_time = Column(DateTime)
    msg_content = Column(Text)
    receiver = Column(String(255))
    issue_id = Column(String(32))
    is_deleted = Column(Integer, default=0)  # 是否被撤回删除(1=是,0=否)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        Index("idx_group_id", "group_id"),
        Index("idx_sender", "sender"),
        Index("idx_msg_time", "msg_time"),
    )
