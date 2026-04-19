import os
import uuid
import asyncio
import aiofiles
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File
from pydantic import BaseModel

from services.import_service import ImportService, _run_import_task

router = APIRouter(prefix="/api/import", tags=["import"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ImportUploadRequest(BaseModel):
    filePath: str


class ImportResponse(BaseModel):
    code: int = 0
    data: dict | None = None
    msg: str = ""


async def _save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file and return the path."""
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(upload_file.filename or ".xlsx")[1] or ".xlsx"
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    async with aiofiles.open(file_path, "wb") as f:
        content = await upload_file.read()
        await f.write(content)
    return file_path


def _run_import(file_path: str, task_id: str) -> None:
    """Background task wrapper for import."""
    try:
        _run_import_task(file_path, task_id)
    except Exception:
        pass


@router.post("/upload", response_model=ImportResponse)
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload Excel/CSV file and trigger async import.
    """
    # Validate file extension
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".xlsx", ".xls", ".csv"]:
        return ImportResponse(
            code=1,
            data=None,
            msg="只支持 .xlsx, .xls, .csv 格式",
        )

    try:
        file_path = await _save_upload_file(file)
    except Exception as e:
        return ImportResponse(
            code=1,
            data=None,
            msg="文件保存失败",
        )

    task_id = str(uuid.uuid4())
    ImportService.init_task(task_id)

    background_tasks.add_task(_run_import, file_path, task_id)

    return ImportResponse(
        code=0,
        data={"taskId": task_id, "status": "processing"},
        msg="",
    )


@router.get("/status/{task_id}", response_model=ImportResponse)
async def get_status(task_id: str):
    """
    Query import task status by task_id.
    """
    task = ImportService.get_task_status(task_id)
    if task is None:
        return ImportResponse(
            code=1,
            data=None,
            msg="任务不存在",
        )

    if task["status"] == "completed":
        return ImportResponse(
            code=0,
            data={
                "taskId": task["task_id"],
                "status": "completed",
                "result": task["result"],
            },
            msg="",
        )
    elif task["status"] == "failed":
        return ImportResponse(
            code=1,
            data={
                "taskId": task["task_id"],
                "status": "failed",
                "error": task["error"],
            },
            msg=task["error"] or "导入失败",
        )
    else:
        return ImportResponse(
            code=0,
            data={
                "taskId": task["task_id"],
                "status": "processing",
            },
            msg="",
        )
