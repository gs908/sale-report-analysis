from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from config.database import Base


class GrpDictType(Base):
    __tablename__ = "sys_dict_type"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type_code = Column(String(64), unique=True, nullable=False)
    type_name = Column(String(128), nullable=False)
    description = Column(String(255))
    status = Column(String(16), default="active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
