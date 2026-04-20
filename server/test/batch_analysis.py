"""
批量分析脚本：用于命令行批量分析群组消息记录

用法：
    python -m server.test.batch_analysis                    # 分析所有群组
    python -m server.test.batch_analysis G_1001           # 分析指定群组
    python -m server.test.batch_analysis --status        # 查看分析状态
    python -m server.test.batch_analysis --dry-run       # 预览待分析消息，不实际调用 LLM
"""
import sys
import argparse
from pathlib import Path

# Add server/ to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from config.database import SessionLocal
from config.llm import load_llm_config
from services.analysis_service import run_analysis
from models.group_info import GrpGroupInfo
from models.msg_raw import GrpMsgRaw
from models.msg_marked import GrpMsgMarked
from models.group_member import GrpGroupMember


def show_status(db: Session):
    """显示各群组的分析进度"""
    groups = db.query(GrpGroupInfo).all()

    print(f"\n{'群ID':<15} {'群名称':<20} {'总消息':<8} {'已分析':<8} {'参与人':<6}")
    print("-" * 65)

    for g in groups:
        total = db.query(GrpMsgRaw).filter(GrpMsgRaw.group_id == g.group_id).count()
        marked = db.query(GrpMsgMarked).join(GrpMsgRaw).filter(GrpMsgRaw.group_id == g.group_id).count()
        participants = db.query(GrpGroupMember).filter(
            GrpGroupMember.group_id == g.group_id,
            GrpGroupMember.is_participant == 1
        ).count()
        pct = f"{marked/total*100:.1f}%" if total > 0 else "N/A"
        print(f"{g.group_id:<15} {g.group_name[:18]:<20} {total:<8} {marked:<8}({pct}) {participants:<6}")


def show_pending(db: Session, group_id: str | None = None):
    """预览待分析消息（不调用 LLM）"""
    groups = [group_id] if group_id else [g.group_id for g in db.query(GrpGroupInfo.group_id).all()]

    for gid in groups:
        participants = {m[0] for m in db.query(GrpGroupMember.member_name).filter(
            GrpGroupMember.group_id == gid,
            GrpGroupMember.is_participant == 1
        ).all()}

        all_msgs = db.query(GrpMsgRaw).filter(GrpMsgRaw.group_id == gid).all()
        marked_ids = {m[0] for m in db.query(GrpMsgMarked.msg_raw_id).join(GrpMsgRaw).filter(
            GrpMsgRaw.group_id == gid
        ).all()}

        pending = [m for m in all_msgs if m.sender not in participants and m.id not in marked_ids]

        print(f"\n{'='*60}")
        print(f"群ID: {gid}  |  待分析: {len(pending)} / {len(all_msgs)} 条")

        if pending:
            batch_size = 15 if len(pending) > 35 else len(pending)
            print(f"将分 { (len(pending) + batch_size - 1) // batch_size } 批分析，每批 ~{batch_size} 条")
            print(f"\n前 3 条预览：")
            for m in pending[:3]:
                sender_tag = "[参与人]" if m.sender in participants else ""
                print(f"  [{m.id}] {m.sender}{sender_tag}: {str(m.msg_content)[:40]}...")


def main():
    parser = argparse.ArgumentParser(description="群消息批量分析工具")
    parser.add_argument("group_id", nargs="?", help="指定群组 ID（不指定则分析所有）")
    parser.add_argument("--status", action="store_true", help="查看各群组分析进度")
    parser.add_argument("--dry-run", action="store_true", help="预览待分析消息，不实际调用 LLM")
    parser.add_argument("--config", action="store_true", help="查看当前 LLM 配置状态")
    args = parser.parse_args()

    load_llm_config()
    db = SessionLocal()

    try:
        if args.config:
            from config.llm import get_llm_config
            cfg = get_llm_config()
            print("\nLLM 配置：")
            print(f"  base_url:         {cfg.get('base_url', '(未配置)')}")
            print(f"  model:            {cfg.get('model', '(未配置)')}")
            print(f"  api_key:          {'已配置' if cfg.get('api_key') else '(未配置)'}")
            batch_cfg = cfg.get("batch", {})
            print(f"  small_threshold:   {batch_cfg.get('small_threshold', 35)}")
            print(f"  large_batch_size: {batch_cfg.get('large_batch_size', 15)}")
            return

        if args.status:
            show_status(db)
            return

        if args.dry_run:
            show_pending(db, args.group_id)
            return

        # 执行分析
        if args.group_id:
            print(f"\n开始分析群组: {args.group_id}")
            result = run_analysis(db, args.group_id)
        else:
            print("\n开始分析所有群组...")
            result = run_analysis(db)

        print(f"\n分析完成: 总计 {result['total']} 条, 成功 {result['analyzed']} 条, 失败 {result['failed']} 条")

    finally:
        db.close()


if __name__ == "__main__":
    main()
