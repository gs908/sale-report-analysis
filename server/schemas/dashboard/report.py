from pydantic import BaseModel, Field


class ReportRecord(BaseModel):
    model_config = {"populate_by_name": True}

    id: str = Field(...)
    leadName: str = Field(..., alias="lead_name")
    customerName: str = Field(..., alias="customer_name")
    person: str = Field(...)
    isReported: bool = Field(default=False, alias="is_reported")
    isReturned: bool = Field(default=False, alias="is_returned")
    processingStatus: str = Field(default="", alias="processing_status")
    isVideoGenerated: bool = Field(default=False, alias="is_video_generated")
    isGroupCreated: bool = Field(default=False, alias="is_group_created")
    remark: str = Field(default="")


class ReportListResponse(BaseModel):
    model_config = {"populate_by_name": True}

    reports: list[ReportRecord]
    total: int
