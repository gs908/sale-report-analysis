"""
模板管理服务
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from models import GrpMsgTemplate
from schemas.admin.template import MsgTemplate, CreateTemplateRequest
from schemas.common import PageResult


def list_templates(db: Session, current: int = 1, size: int = 20) -> PageResult:
    """获取模板（分页）"""
    total = db.query(GrpMsgTemplate).count()
    offset = (current - 1) * size
    templates = db.query(GrpMsgTemplate).offset(offset).limit(size).all()
    return PageResult(
        total=total,
        current=current,
        size=size,
        list=[
            MsgTemplate(
                id=t.id,
                template_code=t.template_code,
                name=t.name,
                usage=t.usage or 0,
                content=t.content or "",
                created_at=t.created_at,
                updated_at=t.updated_at,
            ).model_dump()
            for t in templates
        ]
    )


def create_or_update_template(db: Session, req: CreateTemplateRequest) -> MsgTemplate:
    """创建或更新模板"""
    existing = db.query(GrpMsgTemplate).filter(
        GrpMsgTemplate.template_code == req.template_code
    ).first()
    if existing:
        existing.name = req.name
        existing.content = req.content
        db.commit()
        db.refresh(existing)
        return MsgTemplate(
            id=existing.id,
            template_code=existing.template_code,
            name=existing.name,
            usage=existing.usage or 0,
            content=existing.content or "",
            created_at=existing.created_at,
            updated_at=existing.updated_at,
        )
    t = GrpMsgTemplate(
        template_code=req.template_code,
        name=req.name,
        content=req.content,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return MsgTemplate(
        id=t.id,
        template_code=t.template_code,
        name=t.name,
        usage=t.usage or 0,
        content=t.content or "",
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


def delete_template(db: Session, template_id: int) -> None:
    """删除模板"""
    t = db.query(GrpMsgTemplate).filter(GrpMsgTemplate.id == template_id).first()
    if not t:
        raise ValueError("模板不存在")
    db.delete(t)
    db.commit()
