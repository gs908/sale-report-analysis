from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from config.database import Base


class GrpMsgTemplate(Base):
    __tablename__ = "msg_template"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_code = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    usage = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
