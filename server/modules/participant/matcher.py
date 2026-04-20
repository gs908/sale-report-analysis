"""
群成员管理与报备人标记模块
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.group_info import GrpGroupInfo
from models.group_member import GrpGroupMember


def mark_participants_by_clue(db: Session, participant_data: list[dict]) -> int:
    """
    根据线索ID或线索名称匹配群，并批量标记群成员为报备参与人

    Args:
        db: 数据库会话
        participant_data: [{"lead_id": "...", "lead_name": "...", "member_name": "...", "member_id": "..."}]

    Returns:
        被更新为报备参与人的成员数量
    """
    updated_count = 0

    for item in participant_data:
        lead_id = item.get("lead_id")
        lead_name = item.get("lead_name")
        member_name = item.get("member_name")
        member_id = item.get("member_id")

        # 查询匹配的群：lead_id 或 lead_name 匹配
        query = db.query(GrpGroupInfo)
        if lead_id:
            query = query.filter(GrpGroupInfo.lead_id == lead_id)
        elif lead_name:
            query = query.filter(GrpGroupInfo.lead_name == lead_name)
        else:
            continue

        matched_groups = query.all()

        for group in matched_groups:
            # 查找该群中对应的成员
            member_query = db.query(GrpGroupMember).filter(
                GrpGroupMember.group_id == group.group_id
            )

            if member_id:
                member_query = member_query.filter(GrpGroupMember.member_id == member_id)
            elif member_name:
                member_query = member_query.filter(GrpGroupMember.member_name == member_name)
            else:
                continue

            member = member_query.first()
            if member and member.is_participant != 1:
                member.is_participant = 1
                updated_count += 1

    db.commit()
    return updated_count


def add_member(db: Session, group_id: str, member_name: str, member_id: str = None) -> GrpGroupMember:
    """
    向指定群添加成员

    Args:
        db: 数据库会话
        group_id: 群ID
        member_name: 成员名称
        member_id: 成员ID（可选）

    Returns:
        新增的 GrpGroupMember 记录
    """
    member = GrpGroupMember(
        group_id=group_id,
        member_name=member_name,
        member_id=member_id,
        is_participant=0,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_member(db: Session, member_id: int, is_participant: bool = None, member_name: str = None) -> GrpGroupMember:
    """
    更新成员信息

    Args:
        db: 数据库会话
        member_id: 成员ID
        is_participant: 是否为报备参与人
        member_name: 成员名称（可选）

    Returns:
        更新后的 GrpGroupMember 记录
    """
    member = db.query(GrpGroupMember).filter(GrpGroupMember.id == member_id).first()
    if not member:
        raise ValueError(f"成员不存在: member_id={member_id}")

    if is_participant is not None:
        member.is_participant = 1 if is_participant else 0
    if member_name is not None:
        member.member_name = member_name

    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, member_id: int) -> bool:
    """
    删除群成员

    Args:
        db: 数据库会话
        member_id: 成员ID

    Returns:
        删除是否成功
    """
    member = db.query(GrpGroupMember).filter(GrpGroupMember.id == member_id).first()
    if not member:
        return False

    db.delete(member)
    db.commit()
    return True


# 机器人账号列表（排除在群成员统计和列表之外）
BOT_MEMBER_IDS = {"rxkf01"}


def get_members_by_group(db: Session, group_id: str) -> list[dict]:
    """
    获取指定群的所有成员（排除机器人账号）

    Args:
        db: 数据库会话
        group_id: 群ID

    Returns:
        成员列表 [{id, group_id, member_name, member_id, is_participant, created_at}, ...]
    """
    members = (
        db.query(GrpGroupMember)
        .filter(GrpGroupMember.group_id == group_id)
        .filter(GrpGroupMember.member_id.notin_(BOT_MEMBER_IDS))
        .all()
    )
    return [
        {
            "id": m.id,
            "groupId": m.group_id,
            "memberName": m.member_name,
            "memberId": m.member_id,
            "isParticipant": m.is_participant,
            "createdAt": m.created_at.isoformat() if m.created_at else None,
        }
        for m in members
    ]
