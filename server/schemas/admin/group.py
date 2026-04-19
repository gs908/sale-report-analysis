from pydantic import BaseModel, Field
from datetime import datetime


class MemberRecord(BaseModel):
    model_config = {"populate_by_name": True}

    id: int = Field(...)
    groupId: str = Field(..., alias="group_id")
    memberName: str = Field(..., alias="member_name")
    memberId: str | None = Field(default=None, alias="member_id")
    isParticipant: bool = Field(default=False, alias="is_participant")
    createdAt: datetime | None = Field(default=None, alias="created_at")


class GroupRecord(BaseModel):
    model_config = {"populate_by_name": True}

    id: str = Field(...)
    archiveId: str | None = Field(default=None, alias="archive_id")
    name: str = Field(...)
    leadId: str | None = Field(default=None, alias="lead_id")
    leadName: str | None = Field(default=None, alias="lead_name")
    status: str = Field(default="active")
    createdAt: datetime | None = Field(default=None, alias="created_at")
    dissolvedAt: datetime | None = Field(default=None, alias="dissolved_at")
    members: list[MemberRecord] = Field(default_factory=list)


class CreateGroupRequest(BaseModel):
    model_config = {"populate_by_name": True}

    groupId: str = Field(..., min_length=1, alias="group_id")
    archiveId: str | None = Field(default=None, alias="archive_id")
    groupName: str = Field(..., alias="group_name")
    leadId: str | None = Field(default=None, alias="lead_id")
    leadName: str | None = Field(default=None, alias="lead_name")


class UpdateGroupRequest(BaseModel):
    model_config = {"populate_by_name": True}

    archiveId: str | None = Field(default=None, alias="archive_id")
    groupName: str | None = Field(default=None, alias="group_name")
    leadId: str | None = Field(default=None, alias="lead_id")
    leadName: str | None = Field(default=None, alias="lead_name")
    status: str | None = Field(default=None, alias="status")
