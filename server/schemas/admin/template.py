from pydantic import BaseModel, Field
from datetime import datetime


class MsgTemplate(BaseModel):
    model_config = {"populate_by_name": True}

    id: int | None = Field(default=None)
    templateCode: str = Field(..., alias="template_code")
    name: str = Field(...)
    usage: int = Field(default=0)
    content: str = Field(...)
    createdAt: datetime | None = Field(default=None, alias="created_at")
    updatedAt: datetime | None = Field(default=None, alias="updated_at")


class CreateTemplateRequest(BaseModel):
    model_config = {"populate_by_name": True}

    templateCode: str = Field(..., alias="template_code")
    name: str = Field(...)
    content: str = Field(...)
