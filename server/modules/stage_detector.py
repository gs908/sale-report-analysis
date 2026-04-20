"""
视频阶段检测模块

根据 msg_type='video' 或消息内容中的视频/链接模式划分讨论阶段
"""
import re
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.dialects.mysql import insert

from models.msg_raw import GrpMsgRaw
from models.video_stage import GrpVideoStage

logger = logging.getLogger(__name__)

# 视频/链接检测正则（备用：当 msg_type 不是 'video' 时）
VIDEO_PATTERN = re.compile(
    r'(视频|video|链接|http|watch\?v=)',
    re.IGNORECASE
)

# 自动发送视频的系统账号列表
AUTO_VIDEO_SENDERS = ["融鑫小R", "rxkf01", "系统", "机器人"]


def detect_and_save_stages(db: Session, group_id: str) -> list[dict]:
    """
    检测群组的视频阶段

    优先使用 msg_type='video' 的消息作为阶段边界
    备用：扫描 msg_content 中的视频/链接模式

    阶段划分：
       - stage_index 0 = 群创建到第一个视频
       - stage_index N = 视频N到视频N+1之间

    返回检测到的阶段列表
    """
    # 获取该群所有消息，按时间排序
    messages = (
        db.query(GrpMsgRaw)
        .filter(GrpMsgRaw.group_id == group_id)
        .filter(GrpMsgRaw.is_deleted == 0)  # 排除已删除的消息
        .order_by(GrpMsgRaw.msg_time.asc())
        .all()
    )

    if not messages:
        return []

    # 查找所有视频消息（优先用 msg_type，备用内容匹配）
    video_messages = _detect_video_messages(messages)

    # 删除旧记录
    db.query(GrpVideoStage).filter(GrpVideoStage.group_id == group_id).delete()

    stages = []
    if not video_messages:
        # 无视频：创建单个阶段覆盖所有消息
        first_msg_time = messages[0].msg_time if messages else None
        last_msg_time = messages[-1].msg_time if messages else None

        stage = GrpVideoStage(
            group_id=group_id,
            stage_index=0,
            video_push_time=first_msg_time,
            video_title="无视频阶段",
        )
        db.add(stage)
        stages.append({
            "stageIndex": 0,
            "startTime": first_msg_time,
            "endTime": last_msg_time,
            "videoPushTime": first_msg_time,
            "videoTitle": "无视频阶段",
        })
        logger.info(f"群组 {group_id[:8]}... 无视频消息，创建单阶段")
    else:
        # 根据视频消息划分阶段
        for idx, video_msg in enumerate(video_messages):
            stage = GrpVideoStage(
                group_id=group_id,
                stage_index=idx,
                video_push_time=video_msg["msg_time"],
                video_title=video_msg["title"],
            )
            db.add(stage)

            # 计算阶段结束时间（下一个视频时间或最后一条消息时间）
            if idx + 1 < len(video_messages):
                end_time = video_messages[idx + 1]["msg_time"]
            else:
                end_time = messages[-1].msg_time if messages else None

            stages.append({
                "stageIndex": idx,
                "startTime": video_msg["msg_time"],
                "endTime": end_time,
                "videoPushTime": video_msg["msg_time"],
                "videoTitle": video_msg["title"],
            })

        logger.info(f"群组 {group_id[:8]}... 检测到 {len(video_messages)} 个视频阶段")

    db.commit()
    return stages


def _detect_video_messages(messages: list) -> list[dict]:
    """
    从消息列表中识别视频消息

    优先级：
    1. msg_type = 'video' 的消息
    2. 发送人是系统账号（融鑫小R等）且内容包含视频链接
    3. 内容匹配 VIDEO_PATTERN
    """
    video_messages = []
    seen_times = set()  # 去重：避免同一时间的多条记录

    for msg in messages:
        is_video = False
        title = "视频"

        # 优先判断：msg_type = 'video'
        msg_type = (msg.msg_type or "").lower().strip()
        if msg_type == "video":
            is_video = True
            title = _extract_title(msg.msg_content or "")
            # 如果有发送人信息，加入标题
            if msg.sender:
                title = f"{msg.sender}: {title}"
        # 备用判断：发送人是系统账号 + 内容包含视频链接
        elif msg.sender in AUTO_VIDEO_SENDERS:
            content = msg.msg_content or ""
            if VIDEO_PATTERN.search(content):
                is_video = True
                title = _extract_title(content)
                title = f"{msg.sender}: {title}"
        # 备用判断：内容匹配视频模式
        elif VIDEO_PATTERN.search(msg.msg_content or ""):
            is_video = True
            title = _extract_title(msg.msg_content or "")

        if is_video and msg.msg_time:
            # 按时间去重（精确到秒）
            time_key = msg.msg_time.strftime("%Y-%m-%d %H:%M:%S")
            if time_key not in seen_times:
                seen_times.add(time_key)
                video_messages.append({
                    "msg_time": msg.msg_time,
                    "msg_content": msg.msg_content or "",
                    "msg_id": msg.msg_id,
                    "title": title[:255],  # 限制长度
                })

    return video_messages


def detect_all_groups_stages(db: Session) -> dict:
    """
    为所有群组自动检测视频阶段

    Returns: {group_id: stages_count, ...}
    """
    from models.group_info import GrpGroupInfo

    groups = db.query(GrpGroupInfo.group_id).all()
    results = {}

    for (gid,) in groups:
        try:
            stages = detect_and_save_stages(db, gid)
            results[gid] = len(stages)
        except Exception as e:
            logger.error(f"检测群组 {gid[:8]}... 的视频阶段失败: {e}")
            results[gid] = 0

    return results


def _extract_title(content: str) -> str:
    """从消息内容中提取视频标题"""
    if not content:
        return "视频"

    # 去掉URL，保留文字描述
    title = re.sub(r'https?://\S+', '', content)
    title = re.sub(r'(视频|video|链接)', '', title)
    title = title.strip()

    # 截断过长标题
    if len(title) > 100:
        title = title[:100] + "..."

    return title or "视频"
