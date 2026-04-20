"""
报备数据导入测试脚本

用法：
    cd server
    uv run python test/test_report_import.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy import text

from config.database import SessionLocal


def import_reports(csv_path: str):
    df = pd.read_csv(csv_path, dtype=str, encoding="utf-8", keep_default_na=False)
    print(f"CSV total rows: {len(df)}")

    session = SessionLocal()
    success = 0
    errors = []

    try:
        for idx, row in df.iterrows():
            try:
                report_id = str(row.get("报备编号", "")).strip()
                lead_id = str(row.get("线索编号", "")).strip()
                lead_name = str(row.get("线索名称", "")).strip()
                customer_name = str(row.get("客户名称", "")).strip()
                person = str(row.get("负责人", "")).strip()
                is_reported = 1 if str(row.get("是否已报备", "")).strip() == "1" else 0
                is_returned = 1 if str(row.get("是否已回传", "")).strip() == "1" else 0
                processing_status = str(row.get("处理情况", "")).strip()
                is_video_generated = 1 if str(row.get("是否生成视频", "")).strip() == "1" else 0
                is_group_created = 1 if str(row.get("是否建群", "")).strip() == "1" else 0
                remark = str(row.get("备注", "")).strip()

                if not report_id:
                    errors.append(f"Row {idx+2}: missing report id")
                    continue
                if not lead_id:
                    errors.append(f"Row {idx+2}: missing lead id")
                    continue

                session.execute(
                    text("""
                        INSERT IGNORE INTO crm_report
                            (id, lead_id, lead_name, customer_name, person,
                             is_reported, is_returned, processing_status,
                             is_video_generated, is_group_created, remark)
                        VALUES
                            (:id, :lead_id, :lead_name, :customer_name, :person,
                             :is_reported, :is_returned, :processing_status,
                             :is_video_generated, :is_group_created, :remark)
                    """),
                    {
                        "id": report_id,
                        "lead_id": lead_id,
                        "lead_name": lead_name,
                        "customer_name": customer_name,
                        "person": person,
                        "is_reported": is_reported,
                        "is_returned": is_returned,
                        "processing_status": processing_status,
                        "is_video_generated": is_video_generated,
                        "is_group_created": is_group_created,
                        "remark": remark,
                    },
                )
                session.commit()
                success += 1
                print(f"  [OK] {report_id} | {lead_name[:20]} | reported={is_reported} returned={is_returned}")

            except Exception as e:
                session.rollback()
                errors.append(f"Row {idx+2}: {e}")

    finally:
        session.close()

    print(f"\nImport done: {success} success, {len(errors)} failed")
    if errors:
        for err in errors:
            print(f"  [WARN] {err}")

    # verify
    from config.database import engine
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT id, lead_id, lead_name, is_reported, is_returned, processing_status FROM crm_report"
        ))
        rows = result.fetchall()
        print(f"\ncrm_report table: {len(rows)} records")
        for r in rows:
            print(f"  {r[0]} | {r[1]} | reported={r[3]} returned={r[4]} | {r[5]}")


if __name__ == "__main__":
    csv_file = Path(__file__).parent / "reports_test_data.csv"
    print(f"Reading CSV: {csv_file}\n")
    import_reports(str(csv_file))
