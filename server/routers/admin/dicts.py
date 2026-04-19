"""
Admin - 字典管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config.database import get_db
from schemas.admin.dict import CreateDictTypeRequest, CreateDictItemRequest
from schemas.common import PageResult
from services.admin.dict_service import (
    list_dict_types, list_dict_items,
    create_dict_type, create_dict_item,
)

router = APIRouter(prefix="/api/admin/dicts", tags=["Admin-字典管理"])


@router.get("/types")
def get_dict_types(
    current: int = Query(1, ge=1, alias="current"),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = list_dict_types(db, current, size)
    return {
        "code": 0,
        "data": {
            "total": result.total,
            "current": result.current,
            "size": result.size,
            "list": result.list
        },
        "msg": ""
    }


@router.get("/items/{type_code}")
def get_items(
    type_code: str,
    current: int = Query(1, ge=1, alias="current"),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = list_dict_items(db, type_code, current, size)
    return {
        "code": 0,
        "data": {
            "total": result.total,
            "current": result.current,
            "size": result.size,
            "list": result.list
        },
        "msg": ""
    }


@router.post("/types")
def add_dict_type(body: CreateDictTypeRequest, db: Session = Depends(get_db)):
    try:
        t = create_dict_type(db, body)
        return {"code": 0, "data": t.model_dump(), "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/items")
def add_dict_item(body: CreateDictItemRequest, db: Session = Depends(get_db)):
    try:
        it = create_dict_item(db, body)
        return {"code": 0, "data": it.model_dump(), "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
