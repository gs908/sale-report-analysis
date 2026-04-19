from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.sql import func
from config.database import Base


class GrpGroupInfo(Base):
    """
    群基础信息表

    status 字段说明：
    - active: 活跃中（默认）
    - dissolved: 已解散（售前完成后群解散）
    - closed: 已关闭（群不再活跃但未解散）
    """
    __tablename__ = "grp_group_info"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(String(64), unique=True, nullable=False, comment="群唯一标识")
    archive_id = Column(String(64), comment="归档ID")
    group_name = Column(String(255), comment="群名称")
    issue_id = Column(String(32), comment="工单号，从群名提取 WT-xxx")
    lead_id = Column(String(64), comment="关联线索ID")
    lead_name = Column(String(255), comment="关联线索名称")
    raw_file = Column(String(512), comment="来源文件路径")
    status = Column(String(16), default="active", comment="群状态: active/dissolved/closed")
    dissolved_at = Column(DateTime, comment="解散时间")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_group_status", "status"),
    )
