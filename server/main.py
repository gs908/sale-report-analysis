"""
FastAPI main entry point for group message analysis system.
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.database import create_all
from config.llm import load_llm_config

# Dashboard routers
from routers.dashboard.leads import router as dashboard_leads_router
from routers.dashboard.personnel import router as dashboard_personnel_router
from routers.dashboard.reports import router as dashboard_reports_router
from routers.dashboard.message_groups import router as dashboard_message_groups_router

# Admin routers
from routers.admin.groups import router as admin_groups_router
from routers.admin.members import router as admin_members_router
from routers.admin.templates import router as admin_templates_router
from routers.admin.dicts import router as admin_dicts_router
from routers.admin.fixed_members import router as admin_fixed_members_router
from routers.admin.reports import router as admin_reports_router
from routers.admin.message_groups import router as admin_message_groups_router

# System routers (existing)
from routers.import_api import router as import_router
from routers.group_api import router as group_router
from routers.group_crud_api import router as group_crud_router
from routers.analysis_api import router as analysis_router
from routers.stats_api import router as stats_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all()
    load_llm_config()
    yield


app = FastAPI(
    title="群消息分析系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dashboard APIs
app.include_router(dashboard_leads_router)
app.include_router(dashboard_personnel_router)
app.include_router(dashboard_reports_router)
app.include_router(dashboard_message_groups_router)

# Admin APIs
app.include_router(admin_groups_router)
app.include_router(admin_members_router)
app.include_router(admin_templates_router)
app.include_router(admin_dicts_router)
app.include_router(admin_fixed_members_router)
app.include_router(admin_reports_router)
app.include_router(admin_message_groups_router)

# System APIs
app.include_router(group_crud_router, tags=["群组CRUD"])
app.include_router(import_router, tags=["导入"])
app.include_router(group_router, tags=["群成员"])
app.include_router(analysis_router, tags=["分析"])
app.include_router(stats_router, prefix="/api/stats", tags=["统计"])


@app.get("/")
def root():
    return {"message": "群消息分析系统 API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
