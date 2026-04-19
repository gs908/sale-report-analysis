"""
统计数据服务
"""
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.group_info import GrpGroupInfo
from models.group_member import GrpGroupMember
from models.msg_raw import GrpMsgRaw
from models.msg_marked import GrpMsgMarked
from models.video_stage import GrpVideoStage

# 机器人账号列表（排除在成员统计之外）
BOT_MEMBER_IDS = {"rxkf01"}


def get_summary(db: Session) -> dict:
    """
    获取全局统计摘要

    Returns: {
        totalGroups: N,
        groups: [{
            groupId, groupName, issueId, clueId, clueName,
            memberCount, stageCount
        }, ...]
    }
    """
    groups = db.query(GrpGroupInfo).all()

    result_groups = []
    for g in groups:
        member_count = (
            db.query(GrpGroupMember)
            .filter(GrpGroupMember.group_id == g.group_id)
            .filter(GrpGroupMember.member_id.notin_(BOT_MEMBER_IDS))
            .count()
        )

        stage_count = db.query(GrpVideoStage).filter(
            GrpVideoStage.group_id == g.group_id
        ).count()

        result_groups.append({
            "groupId": g.group_id,
            "groupName": g.group_name,
            "issueId": g.issue_id,
            "leadId": g.lead_id,
            "leadName": g.lead_name,
            "memberCount": member_count,
            "stageCount": stage_count,
        })

    return {
        "totalGroups": len(result_groups),
        "groups": result_groups,
    }


def get_group_stats(db: Session, group_id: str) -> dict:
    """
    获取指定群组的详细统计

    Returns: {
        groupId, groupName, issueId, clueId, clueName,
        members: [{
            memberName, isParticipant, totalReplies, validReplies
        }, ...],
        stages: [{
            stageIndex, startTime, endTime, videoPushTime, videoTitle,
            replies: [{memberName, total, valid}]
        }, ...]
    }
    """
    # 获取群组信息
    group = db.query(GrpGroupInfo).filter(GrpGroupInfo.group_id == group_id).first()
    if not group:
        return {}

    # 获取所有成员（排除机器人账号）
    members = (
        db.query(GrpGroupMember)
        .filter(GrpGroupMember.group_id == group_id)
        .filter(GrpGroupMember.member_id.notin_(BOT_MEMBER_IDS))
        .all()
    )

    member_stats = []
    for m in members:
        # total_replies: 发送的非参与人消息数
        total_replies = db.query(GrpMsgRaw).filter(
            GrpMsgRaw.group_id == group_id,
            GrpMsgRaw.sender == m.member_name,
            GrpMsgRaw.sender != m.member_name  # 排除自己给自己发的情况，实际用 is_participant=0 过滤
        ).count()

        # 正确的 total_replies: sender=member_name 且该 sender 不是 participant
        # 即：is_participant=0 的成员发的消息
        # 实际上：total_replies = count msg_raw where sender=member_name AND is_participant=0
        # 而 is_participant 是成员表字段，所以需要关联查询
        total_replies = (
            db.query(func.count(GrpMsgRaw.id))
            .join(
                GrpGroupMember,
                (GrpGroupMember.member_name == GrpMsgRaw.sender)
                & (GrpGroupMember.group_id == GrpMsgRaw.group_id)
            )
            .filter(
                GrpMsgRaw.group_id == group_id,
                GrpMsgRaw.sender == m.member_name,
                GrpGroupMember.is_participant == 0,
            )
            .scalar() or 0
        )

        # valid_replies: 标记为"有实质建议"的消息数
        valid_replies = (
            db.query(func.count(GrpMsgMarked.id))
            .join(GrpMsgRaw, GrpMsgRaw.id == GrpMsgMarked.msg_raw_id)
            .join(
                GrpGroupMember,
                (GrpGroupMember.member_name == GrpMsgRaw.sender)
                & (GrpGroupMember.group_id == GrpMsgRaw.group_id)
            )
            .filter(
                GrpMsgRaw.group_id == group_id,
                GrpMsgRaw.sender == m.member_name,
                GrpGroupMember.is_participant == 0,
                GrpMsgMarked.tag == "有实质建议",
            )
            .scalar() or 0
        )

        member_stats.append({
            "memberName": m.member_name,
            "isParticipant": bool(m.is_participant),
            "totalReplies": total_replies,
            "validReplies": valid_replies,
        })

    # 获取所有阶段
    stages = db.query(GrpVideoStage).filter(
        GrpVideoStage.group_id == group_id
    ).order_by(GrpVideoStage.stage_index).all()

    stage_stats = []
    for s in stages:
        # 获取该阶段内非参与人的消息
        query = (
            db.query(GrpMsgRaw)
            .join(
                GrpGroupMember,
                (GrpGroupMember.member_name == GrpMsgRaw.sender)
                & (GrpGroupMember.group_id == GrpMsgRaw.group_id)
            )
            .filter(
                GrpMsgRaw.group_id == group_id,
                GrpGroupMember.is_participant == 0,
            )
        )

        # 按时间范围筛选
        if s.video_push_time:
            query = query.filter(GrpMsgRaw.msg_time >= s.video_push_time)
        if s.stage_index > 0:
            # 获取下一个阶段的开始时间
            next_stage = db.query(GrpVideoStage).filter(
                GrpVideoStage.group_id == group_id,
                GrpVideoStage.stage_index == s.stage_index + 1,
            ).first()
            if next_stage and next_stage.video_push_time:
                query = query.filter(GrpMsgRaw.msg_time < next_stage.video_push_time)

        stage_messages = query.all()

        # 按成员统计该阶段的消息数
        member_reply_counts = {}
        for msg in stage_messages:
            sender = msg.sender or "未知"
            if sender not in member_reply_counts:
                member_reply_counts[sender] = {"total": 0, "valid": 0}
            member_reply_counts[sender]["total"] += 1

        # 获取有效回复
        marked_ids = [m.id for m in stage_messages]
        if marked_ids:
            marked_valid = (
                db.query(GrpMsgMarked.msg_raw_id)
                .filter(
                    GrpMsgMarked.msg_raw_id.in_(marked_ids),
                    GrpMsgMarked.tag == "有实质建议",
                )
                .all()
            )
            valid_ids = set(r[0] for r in marked_valid)
            for msg in stage_messages:
                sender = msg.sender or "未知"
                if msg.id in valid_ids:
                    member_reply_counts[sender]["valid"] += 1

        replies_list = [
            {"memberName": name, "total": v["total"], "valid": v["valid"]}
            for name, v in member_reply_counts.items()
        ]

        stage_stats.append({
            "stageIndex": s.stage_index,
            "startTime": s.video_push_time,
            "endTime": None,  # 将在下面根据下一阶段补充
            "videoPushTime": s.video_push_time,
            "videoTitle": s.video_title,
            "replies": replies_list,
        })

    # 补充 endTime
    for i, stage in enumerate(stage_stats):
        if i + 1 < len(stage_stats):
            stage["endTime"] = stage_stats[i + 1]["startTime"]
        else:
            # 最后一个阶段的结束时间是群组最后一条消息时间
            last_msg = (
                db.query(GrpMsgRaw.msg_time)
                .filter(GrpMsgRaw.group_id == group_id)
                .order_by(GrpMsgRaw.msg_time.desc())
                .first()
            )
            stage["endTime"] = last_msg[0] if last_msg else None

    return {
        "groupId": group.group_id,
        "groupName": group.group_name,
        "issueId": group.issue_id,
        "leadId": group.lead_id,
        "leadName": group.lead_name,
        "members": member_stats,
        "stages": stage_stats,
    }


def get_person_stats(db: Session, person_name: str) -> dict:
    """
    获取指定人员的统计（跨所有群组）

    Returns: {
        personName: str,
        groups: [{
            groupId, groupName, totalReplies, validReplies
        }, ...]
    }
    """
    # 查找该人员所在的所有群组
    memberships = (
        db.query(GrpGroupMember)
        .filter(GrpGroupMember.member_name == person_name)
        .all()
    )

    group_stats_list = []
    for m in memberships:
        group = db.query(GrpGroupInfo).filter(
            GrpGroupInfo.group_id == m.group_id
        ).first()
        if not group:
            continue

        # total_replies: 该成员在群中发送的非参与人消息
        total_replies = (
            db.query(func.count(GrpMsgRaw.id))
            .join(
                GrpGroupMember,
                (GrpGroupMember.member_name == GrpMsgRaw.sender)
                & (GrpGroupMember.group_id == GrpMsgRaw.group_id)
            )
            .filter(
                GrpMsgRaw.group_id == m.group_id,
                GrpMsgRaw.sender == person_name,
                GrpGroupMember.is_participant == 0,
            )
            .scalar() or 0
        )

        # valid_replies: 标记为"有实质建议"的消息
        valid_replies = (
            db.query(func.count(GrpMsgMarked.id))
            .join(GrpMsgRaw, GrpMsgRaw.id == GrpMsgMarked.msg_raw_id)
            .join(
                GrpGroupMember,
                (GrpGroupMember.member_name == GrpMsgRaw.sender)
                & (GrpGroupMember.group_id == GrpMsgRaw.group_id)
            )
            .filter(
                GrpMsgRaw.group_id == m.group_id,
                GrpMsgRaw.sender == person_name,
                GrpGroupMember.is_participant == 0,
                GrpMsgMarked.tag == "有实质建议",
            )
            .scalar() or 0
        )

        group_stats_list.append({
            "groupId": m.group_id,
            "groupName": group.group_name,
            "totalReplies": total_replies,
            "validReplies": valid_replies,
        })

    return {
        "personName": person_name,
        "groups": group_stats_list,
    }


def get_group_messages(db: Session, group_id: str) -> list[dict]:
    """
    获取指定群组的所有消息（带分析标记）

    Returns: [{
        id, msgId, sender, msgContent, msgTime,
        tag, reason
    }, ...]
    """
    messages = (
        db.query(GrpMsgRaw)
        .filter(GrpMsgRaw.group_id == group_id)
        .order_by(GrpMsgRaw.msg_time.asc())
        .all()
    )

    marked = {
        row.msg_raw_id: row
        for row in db.query(GrpMsgMarked).all()
    }

    result = []
    for m in messages:
        marked_row = marked.get(m.id)
        result.append({
            "id": m.id,
            "msgId": m.msg_id,
            "sender": m.sender,
            "msgContent": m.msg_content,
            "msgTime": m.msg_time.isoformat() if m.msg_time else None,
            "tag": marked_row.tag if marked_row else None,
            "reason": marked_row.reason if marked_row else None,
        })

    return result
