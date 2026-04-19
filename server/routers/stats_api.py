"""
统计数据 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config.database import get_db
from services.stats_service import (
    get_summary,
    get_group_stats,
    get_person_stats,
    get_group_messages,
)

router = APIRouter(tags=["stats"])


# ─────────────────────────────────────────────
# GET /api/stats/summary
# ─────────────────────────────────────────────
@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    """获取全局统计摘要"""
    try:
        data = get_summary(db)
        return {"code": 0, "data": data, "msg": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# GET /api/stats/group/{group_id}
# ─────────────────────────────────────────────
@router.get("/group/{group_id}")
def group_stats(group_id: str, db: Session = Depends(get_db)):
    """获取指定群组的详细统计"""
    try:
        data = get_group_stats(db, group_id)
        if not data:
            raise HTTPException(status_code=404, detail="群组不存在")
        return {"code": 0, "data": data, "msg": ""}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# GET /api/stats/person/{name}
# ─────────────────────────────────────────────
@router.get("/person/{name}")
def person_stats(name: str, db: Session = Depends(get_db)):
    """获取指定人员的统计（跨所有群组）"""
    try:
        data = get_person_stats(db, name)
        return {"code": 0, "data": data, "msg": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# GET /api/stats/group/{group_id}/messages
# ─────────────────────────────────────────────
@router.get("/group/{group_id}/messages")
def group_messages(group_id: str, db: Session = Depends(get_db)):
    """获取指定群组的消息列表（带分析标记）"""
    try:
        data = get_group_messages(db, group_id)
        return {"code": 0, "data": data, "msg": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    """获取指定人员的统计（跨所有群组）"""
    try:
        data = get_person_stats(db, name)
        return {"code": 0, "data": data, "msg": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
