"""
线索数据导入测试脚本

用法：
    cd server
    uv run python test/test_lead_import.py

说明：
    读取 test/leads_test_data.csv，映射到 crm_lead 表现有字段并插入。
    status 字段映射：
        交流/立项/跟进中 -> active
        立项审批通过/已报备/已成交/已关闭 -> 具体状态值
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy import text

from config.database import SessionLocal, engine


def _map_status(stage: str) -> str:
    """根据跟进阶段/目前阶段映射 status"""
    if not stage:
        return "active"
    stage = stage.strip()
    if stage in ("交流", "跟进中", "初步接触"):
        return "active"
    if stage in ("立项审批通过（销售）", "立项", "报价中", "投标中"):
        return "已报备"
    if "中标" in stage:
        return "已中标"
    if "成交" in stage:
        return "已成交"
    if "关闭" in stage or "失败" in stage:
        return "已关闭"
    return "active"


def import_leads(csv_path: str):
    # 读取 CSV（处理空值和特殊字符）
    df = pd.read_csv(
        csv_path,
        dtype=str,
        encoding="utf-8",
        keep_default_na=False,
    )

    print(f"CSV 总行数（含表头）: {len(df)}")
    print(f"可用字段: {list(df.columns)}")

    session = SessionLocal()
    success = 0
    errors = []

    try:
        for idx, row in df.iterrows():
            try:
                lead_id = str(row.get("线索编号", "")).strip()
                lead_name = str(row.get("线索名称", "")).strip()
                customer_name = str(row.get("客户名称", "")).strip()
                # 承接人优先，其次销售
                person = (
                    str(row.get("承接人", "")).strip()
                    or str(row.get("销售", "")).strip()
                )
                # 目前阶段优先，其次跟进阶段
                stage = (
                    str(row.get("目前阶段", "")).strip()
                    or str(row.get("跟进阶段", "")).strip()
                )

                if not lead_id:
                    errors.append(f"行 {idx+2}: 缺少线索编号，跳过")
                    continue
                if not lead_name:
                    errors.append(f"行 {idx+2}: 缺少线索名称，跳过")
                    continue

                status = _map_status(stage)

                session.execute(
                    text("""
                        INSERT IGNORE INTO crm_lead
                            (id, lead_name, customer_name, person, status)
                        VALUES
                            (:id, :lead_name, :customer_name, :person, :status)
                    """),
                    {
                        "id": lead_id,
                        "lead_name": lead_name,
                        "customer_name": customer_name,
                        "person": person,
                        "status": status,
                    },
                )
                session.commit()
                success += 1
                print(f"  [OK] {lead_id} | {lead_name[:30]} | status={status}")

            except Exception as e:
                session.rollback()
                errors.append(f"Row {idx+2}: {e}")

    finally:
        session.close()

    print(f"\n导入完成：成功 {success}，失败 {len(errors)}")
    if errors:
        for err in errors:
            print(f"  [WARN] {err}")

    # 验证
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, lead_name, customer_name, person, status FROM crm_lead"))
        rows = result.fetchall()
        print(f"\n当前 crm_lead 表共 {len(rows)} 条记录：")
        for r in rows:
            print(f"  {r[0]} | {str(r[1])[:25]} | {str(r[2])[:15]} | {r[3]} | {r[4]}")


if __name__ == "__main__":
    csv_file = Path(__file__).parent / "leads_test_data.csv"
    print(f"读取 CSV: {csv_file}\n")
    import_leads(str(csv_file))
