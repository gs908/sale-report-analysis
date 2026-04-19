from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from config.database import Base


class GrpDictItem(Base):
    __tablename__ = "sys_dict_item"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type_code = Column(String(64), ForeignKey("sys_dict_type.type_code", ondelete="CASCADE"), nullable=False)
    item_code = Column(String(64), nullable=False)
    item_name = Column(String(128), nullable=False)
    sort_order = Column(Integer, default=0)
    status = Column(String(16), default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
