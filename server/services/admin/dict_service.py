"""
字典管理服务
"""
from sqlalchemy.orm import Session

from models import GrpDictType, GrpDictItem
from schemas.admin.dict import DictType, DictItem, CreateDictTypeRequest, CreateDictItemRequest
from schemas.common import PageResult


def list_dict_types(db: Session, current: int = 1, size: int = 20) -> PageResult:
    """获取字典类型（分页）"""
    total = db.query(GrpDictType).count()
    offset = (current - 1) * size
    types = db.query(GrpDictType).offset(offset).limit(size).all()
    return PageResult(
        total=total,
        current=current,
        size=size,
        list=[
            DictType(
                id=t.id,
                type_code=t.type_code,
                type_name=t.type_name,
                description=t.description or "",
                status=t.status or "active",
                created_at=t.created_at,
                updated_at=t.updated_at,
            ).model_dump()
            for t in types
        ]
    )


def list_dict_items(db: Session, type_code: str, current: int = 1, size: int = 20) -> PageResult:
    """获取字典明细（分页）"""
    query = db.query(GrpDictItem).filter(GrpDictItem.type_code == type_code)
    total = query.count()
    offset = (current - 1) * size
    items = query.order_by(GrpDictItem.sort_order).offset(offset).limit(size).all()
    return PageResult(
        total=total,
        current=current,
        size=size,
        list=[
            DictItem(
                id=it.id,
                type_code=it.type_code,
                item_code=it.item_code,
                item_name=it.item_name,
                sort_order=it.sort_order or 0,
                status=it.status or "active",
                created_at=it.created_at,
                updated_at=it.updated_at,
            ).model_dump()
            for it in items
        ]
    )


def create_dict_type(db: Session, req: CreateDictTypeRequest) -> DictType:
    """创建字典类型"""
    existing = db.query(GrpDictType).filter(GrpDictType.type_code == req.type_code).first()
    if existing:
        raise ValueError("字典类型编码已存在")
    t = GrpDictType(
        type_code=req.type_code,
        type_name=req.type_name,
        description=req.description,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return DictType(
        id=t.id,
        type_code=t.type_code,
        type_name=t.type_name,
        description=t.description or "",
        status=t.status or "active",
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


def create_dict_item(db: Session, req: CreateDictItemRequest) -> DictItem:
    """创建字典项"""
    existing = db.query(GrpDictItem).filter(
        GrpDictItem.type_code == req.type_code,
        GrpDictItem.item_code == req.item_code,
    ).first()
    if existing:
        raise ValueError("字典项编码已存在")
    it = GrpDictItem(
        type_code=req.type_code,
        item_code=req.item_code,
        item_name=req.item_name,
        sort_order=req.sort_order,
    )
    db.add(it)
    db.commit()
    db.refresh(it)
    return DictItem(
        id=it.id,
        type_code=it.type_code,
        item_code=it.item_code,
        item_name=it.item_name,
        sort_order=it.sort_order or 0,
        status=it.status or "active",
        created_at=it.created_at,
        updated_at=it.updated_at,
    )
