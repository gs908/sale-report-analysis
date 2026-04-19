from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.sql import func
from config.database import Base


class GrpPersonStats(Base):
    """
    个人维度统计表

    按人统计跨群组的表现：
    - 参与的群数
    - 有发言的群数
    - 有实质建议的群数
    - 发言占比（按群数）
    - 实质发言占比（按群数）
    - 实质发言消息总数
    """
    __tablename__ = "grp_person_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    member_name = Column(String(128), nullable=False, comment="成员姓名")
    total_groups = Column(Integer, default=0, comment="参与的群数")
    groups_with_speech = Column(Integer, default=0, comment="有发言的群数")
    groups_with_meaningful = Column(Integer, default=0, comment="有实质建议的群数")
    speech_rate = Column(Integer, default=0, comment="发言占比（百分比，如 75 表示 75%）")
    meaningful_rate = Column(Integer, default=0, comment="实质发言占比（百分比）")
    total_meaningful_messages = Column(Integer, default=0, comment="实质发言消息总数")
    period_key = Column(String(32), comment="统计周期/阶段标识")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_member_name", "member_name"),
        Index("idx_period_key", "period_key"),
    )
