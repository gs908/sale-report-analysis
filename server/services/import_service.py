import uuid
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session

from modules.excel.importer import import_batch

# In-memory task store for async import tracking
_task_store: dict[str, dict] = {}
_executor = ThreadPoolExecutor(max_workers=4)
_lock = threading.Lock()


def _run_import_task(file_path: str, task_id: str) -> dict:
    """Execute import in thread pool, update task store."""
    try:
        result = import_batch(file_path)
        with _lock:
            _task_store[task_id] = {
                "task_id": task_id,
                "status": "completed",
                "result": result,
                "error": None,
            }
        return result
    except Exception as e:
        with _lock:
            _task_store[task_id] = {
                "task_id": task_id,
                "status": "failed",
                "result": None,
                "error": str(e),
            }
        raise


class ImportService:

    @staticmethod
    def import_file(file_path: str, db: Session | None = None) -> dict:
        """
        Run import synchronously in thread pool.
        Returns: {task_id, status}
        """
        task_id = str(uuid.uuid4())
        with _lock:
            _task_store[task_id] = {
                "task_id": task_id,
                "status": "processing",
                "result": None,
                "error": None,
            }

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_in_executor(_executor, _run_import_task, file_path, task_id)

        return {
            "task_id": task_id,
            "status": "processing",
        }

    @staticmethod
    def get_task_status(task_id: str) -> dict | None:
        """Return task status or None if not found."""
        with _lock:
            return _task_store.get(task_id)

    @staticmethod
    def init_task(task_id: str) -> None:
        """Initialize a task entry in the store."""
        with _lock:
            _task_store[task_id] = {
                "task_id": task_id,
                "status": "processing",
                "result": None,
                "error": None,
            }

    @staticmethod
    def import_file_sync(file_path: str) -> dict:
        """
        Run import synchronously (blocking).
        Returns import summary directly.
        """
        return import_batch(file_path)
