"""
分析 API 路由
"""
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config.database import get_db
from services.analysis_service import run_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

# In-memory task tracking (for demo; use Redis in production)
_task_store: dict[str, dict] = {}


class RunAnalysisRequest(BaseModel):
    groupId: Optional[str] = None


def _run_analysis_task(task_id: str, group_id: Optional[str] = None):
    """Background task wrapper"""
    from config.database import SessionLocal
    db = SessionLocal()
    try:
        _task_store[task_id] = {"status": "running", "progress": 0}
        result = run_analysis(db, group_id)
        _task_store[task_id] = {"status": "completed", "result": result}
    except Exception as e:
        logger.error(f"Analysis task {task_id} failed: {e}")
        _task_store[task_id] = {"status": "failed", "error": str(e)}
    finally:
        db.close()


# ─────────────────────────────────────────────
# POST /api/analysis/run
# ─────────────────────────────────────────────
@router.post("/run")
def run_analysis_endpoint(
    body: RunAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    运行群消息分析

    - body.groupId 为空：分析所有有待分析消息的群组
    - body.groupId 有值：仅分析指定群组
    - 非阻塞执行，结果通过 /api/analysis/status/{task_id} 查询
    """
    task_id = str(uuid.uuid4())

    # 验证 group_id 存在（如果指定了）
    if body.groupId:
        from models.group_info import GrpGroupInfo
        exists = db.query(GrpGroupInfo.group_id).filter(
            GrpGroupInfo.group_id == body.groupId
        ).first()
        if not exists:
            raise HTTPException(status_code=404, detail="群组不存在")

    # 启动后台任务
    background_tasks.add_task(_run_analysis_task, task_id, body.groupId)

    return {"code": 0, "data": {"taskId": task_id}, "msg": ""}


# ─────────────────────────────────────────────
# GET /api/analysis/status/{task_id}
# ─────────────────────────────────────────────
@router.get("/status/{task_id}")
def get_analysis_status(task_id: str):
    """查询分析任务状态"""
    if task_id not in _task_store:
        raise HTTPException(status_code=404, detail="任务不存在")
    task_info = _task_store[task_id]
    return {"code": 0, "data": task_info, "msg": ""}
