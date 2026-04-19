"""
群成员管理 API 路由
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from config.database import get_db
from modules.participant.matcher import (
    mark_participants_by_clue,
    add_member,
    update_member,
    remove_member,
    get_members_by_group,
)
import pandas as pd
import io

router = APIRouter(prefix="/api", tags=["group"])


# ─────────────────────────────────────────────
# Request Schemas
# ─────────────────────────────────────────────
class AddMemberRequest(BaseModel):
    memberName: str = Field(..., min_length=1, description="成员名称")
    memberId: str | None = Field(None, description="成员ID")


class UpdateMemberRequest(BaseModel):
    isParticipant: bool | None = Field(None, description="是否为报备参与人")
    memberName: str | None = Field(None, description="成员名称")


# ─────────────────────────────────────────────
# GET /api/group/members/{group_id}
# ─────────────────────────────────────────────
@router.get("/group/members/{group_id}")
def get_group_members(group_id: str, db: Session = Depends(get_db)):
    """获取指定群的所有成员"""
    members = get_members_by_group(db, group_id)
    return {"code": 0, "data": members, "msg": ""}


# ─────────────────────────────────────────────
# POST /api/group/members/{group_id}
# ─────────────────────────────────────────────
@router.post("/group/members/{group_id}")
def create_group_member(group_id: str, body: AddMemberRequest, db: Session = Depends(get_db)):
    """向指定群添加成员"""
    try:
        member = add_member(db, group_id, body.memberName, body.memberId)
        return {
            "code": 0,
            "data": {
                "member": {
                    "id": member.id,
                    "groupId": member.group_id,
                    "memberName": member.member_name,
                    "memberId": member.member_id,
                    "isParticipant": member.is_participant,
                    "createdAt": member.created_at.isoformat() if member.created_at else None,
                }
            },
            "msg": "",
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="成员已存在")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# PUT /api/group/members/{member_id}
# ─────────────────────────────────────────────
@router.put("/group/members/{member_id}")
def modify_group_member(member_id: int, body: UpdateMemberRequest, db: Session = Depends(get_db)):
    """更新成员信息"""
    try:
        member = update_member(
            db,
            member_id,
            is_participant=body.isParticipant,
            member_name=body.memberName,
        )
        return {
            "code": 0,
            "data": {
                "member": {
                    "id": member.id,
                    "groupId": member.group_id,
                    "memberName": member.member_name,
                    "memberId": member.member_id,
                    "isParticipant": member.is_participant,
                    "createdAt": member.created_at.isoformat() if member.created_at else None,
                }
            },
            "msg": "",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# DELETE /api/group/members/{member_id}
# ─────────────────────────────────────────────
@router.delete("/group/members/{member_id}")
def delete_group_member(member_id: int, db: Session = Depends(get_db)):
    """删除群成员"""
    success = remove_member(db, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="成员不存在")
    return {"code": 0, "msg": ""}


# ─────────────────────────────────────────────
# POST /api/participant/import
# ─────────────────────────────────────────────
@router.post("/participant/import")
async def import_participants(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    批量导入报备参与人（Excel/CSV）
    文件格式：lead_id, lead_name, member_name, member_id
    """
    try:
        contents = await file.read()

        # 支持 Excel 和 CSV
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="仅支持 Excel (.xlsx/.xls) 或 CSV 文件")

        # 转换为列表字典
        required_cols = ["member_name"]
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail=f"文件必须包含列: {', '.join(required_cols)}")

        participant_data = []
        for _, row in df.iterrows():
            participant_data.append({
                "lead_id": str(row.get("lead_id", "")) if pd.notna(row.get("lead_id")) else None,
                "lead_name": str(row.get("lead_name", "")) if pd.notna(row.get("lead_name")) else None,
                "member_name": str(row["member_name"]) if pd.notna(row["member_name"]) else None,
                "member_id": str(row.get("member_id", "")) if pd.notna(row.get("member_id")) else None,
            })

        updated_count = mark_participants_by_clue(db, participant_data)
        return {"code": 0, "data": {"updatedCount": updated_count}, "msg": ""}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")
