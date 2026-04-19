from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from config.database import Base


class GrpGroupMsgStat(Base):
    """
    群消息统计表（按群统计）

    记录每个群组的统计信息：
    - 需发言人数（群成员中非参与人数量）
    - 实际发言人数
    - 有效回复数（有实质建议的消息数）
    """
    __tablename__ = "grp_group_msg_stat"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(String(64), ForeignKey("grp_group_info.group_id", ondelete="CASCADE"), nullable=False)
    participant_name = Column(String(128), comment="参与人姓名（NULL表示群组级统计）")
    total_replies = Column(Integer, default=0, comment="总回复数/需发言人数")
    valid_replies = Column(Integer, default=0, comment="有效回复数（有实质建议）")
    period_key = Column(String(32), comment="统计周期/阶段标识")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_group_stat", "group_id", "period_key"),
    )
