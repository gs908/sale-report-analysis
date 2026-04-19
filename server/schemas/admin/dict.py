from pydantic import BaseModel, Field
from datetime import datetime


class DictType(BaseModel):
    model_config = {"populate_by_name": True}

    id: int | None = Field(default=None)
    typeCode: str = Field(..., alias="type_code")
    typeName: str = Field(..., alias="type_name")
    description: str = Field(default="")
    status: str = Field(default="active")
    createdAt: datetime | None = Field(default=None, alias="created_at")
    updatedAt: datetime | None = Field(default=None, alias="updated_at")


class DictItem(BaseModel):
    model_config = {"populate_by_name": True}

    id: int | None = Field(default=None)
    typeCode: str = Field(..., alias="type_code")
    itemCode: str = Field(..., alias="item_code")
    itemName: str = Field(..., alias="item_name")
    sortOrder: int = Field(default=0, alias="sort_order")
    status: str = Field(default="active")
    createdAt: datetime | None = Field(default=None, alias="created_at")
    updatedAt: datetime | None = Field(default=None, alias="updated_at")


class CreateDictTypeRequest(BaseModel):
    model_config = {"populate_by_name": True}

    typeCode: str = Field(..., alias="type_code")
    typeName: str = Field(..., alias="type_name")
    description: str = Field(default="")


class CreateDictItemRequest(BaseModel):
    model_config = {"populate_by_name": True}

    typeCode: str = Field(..., alias="type_code")
    itemCode: str = Field(..., alias="item_code")
    itemName: str = Field(..., alias="item_name")
    sortOrder: int = Field(default=0, alias="sort_order")
