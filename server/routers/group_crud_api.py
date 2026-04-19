"""
群组 CRUD API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from config.database import get_db
from models.group_info import GrpGroupInfo
from models.group_member import GrpGroupMember

router = APIRouter(prefix="/api/groups", tags=["群组管理"])


class CreateGroupRequest(BaseModel):
    groupId: str = Field(..., min_length=1, description="群ID")
    archiveId: str | None = Field(None, description="归档ID")
    groupName: str = Field(..., description="群名称")
    issueId: str | None = Field(None, description="工单号")
    leadId: str | None = Field(None, description="线索ID")
    leadName: str | None = Field(None, description="线索名称")


class UpdateGroupRequest(BaseModel):
    archiveId: str | None = Field(None, description="归档ID")
    groupName: str | None = Field(None, description="群名称")
    issueId: str | None = Field(None, description="工单号")
    leadId: str | None = Field(None, description="线索ID")
    leadName: str | None = Field(None, description="线索名称")
    status: str | None = Field(None, description="群状态: active/dissolved/closed")


def _group_to_dict(g: GrpGroupInfo, member_count: int = 0) -> dict:
    return {
        "groupId": g.group_id,
        "archiveId": g.archive_id,
        "groupName": g.group_name,
        "issueId": g.issue_id,
        "leadId": g.lead_id,
        "leadName": g.lead_name,
        "status": g.status,
        "memberCount": member_count,
        "createdAt": g.created_at.isoformat() if g.created_at else None,
    }


@router.get("")
def list_groups(db: Session = Depends(get_db)):
    """获取所有群列表，含成员数量"""
    groups = db.query(GrpGroupInfo).order_by(GrpGroupInfo.created_at.desc()).all()
    result = []
    for g in groups:
        member_count = db.query(GrpGroupMember).filter(GrpGroupMember.group_id == g.group_id).count()
        result.append(_group_to_dict(g, member_count))
    return {"code": 0, "data": result, "msg": ""}


@router.post("")
def create_group(body: CreateGroupRequest, db: Session = Depends(get_db)):
    """新建群组"""
    existing = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == body.groupId).first()
    if existing:
        raise HTTPException(status_code=400, detail="群ID已存在")
    g = GrpGroupInfo(
        group_id=body.groupId,
        archive_id=body.archiveId,
        group_name=body.groupName,
        issue_id=body.issueId,
        lead_id=body.leadId,
        lead_name=body.leadName,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"code": 0, "data": _group_to_dict(g, 0), "msg": ""}


@router.put("/{group_id}")
def update_group(group_id: str, body: UpdateGroupRequest, db: Session = Depends(get_db)):
    """更新群组信息"""
    g = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="群不存在")
    if body.archiveId is not None:
        g.archive_id = body.archiveId
    if body.groupName is not None:
        g.group_name = body.groupName
    if body.issueId is not None:
        g.issue_id = body.issueId
    if body.leadId is not None:
        g.lead_id = body.leadId
    if body.leadName is not None:
        g.lead_name = body.leadName
    if body.status is not None:
        g.status = body.status
    db.commit()
    db.refresh(g)
    member_count = db.query(GrpGroupMember).filter(GrpGroupMember.group_id == g.group_id).count()
    return {"code": 0, "data": _group_to_dict(g, member_count), "msg": ""}


@router.delete("/{group_id}")
def delete_group(group_id: str, db: Session = Depends(get_db)):
    """删除群组（成员和消息会级联删除）"""
    g = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="群不存在")
    db.delete(g)
    db.commit()
    return {"code": 0, "msg": ""}
