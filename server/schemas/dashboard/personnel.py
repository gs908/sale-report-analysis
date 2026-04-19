from pydantic import BaseModel, Field


class PersonnelRecord(BaseModel):
    model_config = {"populate_by_name": True}

    name: str = Field(...)
    isFixedMember: bool = Field(default=False, alias="is_fixed_member")
    involvedGroups: int = Field(default=0, alias="involved_groups")
    speakingGroups: int = Field(default=0, alias="speaking_groups")
    totalMessages: int = Field(default=0, alias="total_messages")


class PersonnelListResponse(BaseModel):
    model_config = {"populate_by_name": True}

    personnel: list[PersonnelRecord]
    total: int
