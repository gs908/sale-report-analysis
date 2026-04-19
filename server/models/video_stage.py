from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from config.database import Base


class GrpVideoStage(Base):
    __tablename__ = "grp_video_stage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(String(64), ForeignKey("grp_group_info.group_id", ondelete="CASCADE"))
    stage_index = Column(Integer)  # 阶段序号
    video_push_time = Column(DateTime, nullable=True)
    video_title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
