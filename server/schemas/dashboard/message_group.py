from pydantic import BaseModel, Field
from datetime import datetime


class MsgGroup(BaseModel):
    model_config = {"populate_by_name": True}

    id: str = Field(...)
    name: str = Field(...)
    leadName: str = Field(default="", alias="lead_name")
    msgCount: int = Field(default=0, alias="msg_count")
    lastActive: datetime | None = Field(default=None, alias="last_active")


class MsgGroupListResponse(BaseModel):
    model_config = {"populate_by_name": True}

    groups: list[MsgGroup]
    total: int
