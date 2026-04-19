from pydantic import BaseModel, Field


class LeadRecord(BaseModel):
    model_config = {"populate_by_name": True}

    id: str = Field(...)
    leadName: str = Field(..., alias="lead_name")
    customerName: str = Field(..., alias="customer_name")
    person: str = Field(...)
    isReported: bool = Field(default=False, alias="is_reported")
    reportStatus: str = Field(default="", alias="report_status")
    groupCount: int = Field(default=0, alias="group_count")


class LeadListResponse(BaseModel):
    model_config = {"populate_by_name": True}

    leads: list[LeadRecord]
    total: int
