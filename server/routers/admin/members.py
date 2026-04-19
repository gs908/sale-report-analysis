"""
Admin - 成员管理接口
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.database import get_db
from services.admin.member_service import update_member

router = APIRouter(prefix="/api/admin/groups", tags=["Admin-成员管理"])


class UpdateMemberRequest(BaseModel):
    model_config = {"populate_by_name": True}

    isParticipant: bool | None = Field(default=None, alias="is_participant")
    memberName: str | None = Field(default=None, alias="member_name")


@router.put("/{group_id}/members/{member_id}")
def modify_member(member_id: int, body: UpdateMemberRequest, db: Session = Depends(get_db)):
    try:
        m = update_member(db, member_id, body.isParticipant, body.memberName)
        return {"code": 0, "data": m.model_dump(), "msg": ""}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
