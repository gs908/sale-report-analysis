from typing import Any, List
from pydantic import BaseModel, ConfigDict


class ApiResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: int = 0
    data: Any | None = None
    msg: str = ""


class PageQuery(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page: int = 1
    page_size: int = 20


class PageResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total: int
    current: int
    size: int
    list: List[dict] = []
