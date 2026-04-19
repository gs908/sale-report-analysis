from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class FixedMemberRecord(BaseModel):
    model_config = {"populate_by_name": True}

    id: int | None = Field(default=None)
    memberId: str | None = Field(default=None, alias="member_id")
    memberName: str = Field(..., alias="member_name")
    isFixed: bool = Field(default=True, alias="is_fixed")
    remark: str = Field(default="")
    createdAt: datetime | None = Field(default=None, alias="created_at")
    updatedAt: datetime | None = Field(default=None, alias="updated_at")


class CreateFixedMemberRequest(BaseModel):
    model_config = {"populate_by_name": True}

    memberId: str | None = Field(default=None, alias="member_id")
    memberName: str = Field(..., alias="member_name")
    remark: str = Field(default="")


class UpdateFixedMemberRequest(BaseModel):
    model_config = {"populate_by_name": True}

    memberName: str | None = Field(default=None, alias="member_name")
    isFixed: bool | None = Field(default=None, alias="is_fixed")
    remark: str | None = Field(default=None)
