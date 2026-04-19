"""
Admin - 模板管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config.database import get_db
from schemas.admin.template import CreateTemplateRequest
from services.admin.template_service import list_templates, create_or_update_template, delete_template

router = APIRouter(prefix="/api/admin/templates", tags=["Admin-模板管理"])


@router.get("")
def get_templates(
    current: int = Query(1, ge=1, alias="current"),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = list_templates(db, current, size)
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


@router.post("")
def save_template(body: CreateTemplateRequest, db: Session = Depends(get_db)):
    t = create_or_update_template(db, body)
    return {"code": 0, "data": t.model_dump(), "msg": ""}


@router.delete("/{template_id}")
def remove_template(template_id: int, db: Session = Depends(get_db)):
    try:
        delete_template(db, template_id)
        return {"code": 0, "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
