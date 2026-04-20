"""
固定成员导入测试脚本

用法：
    cd server
    uv run python test/test_fixed_member_import.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlalchemy import text

from config.database import SessionLocal, engine


def import_fixed_members(csv_path: str):
    df = pd.read_csv(csv_path, dtype=str, encoding="utf-8", keep_default_na=False)
    print(f"CSV total rows: {len(df)}")

    session = SessionLocal()
    success = 0
    errors = []

    try:
        for idx, row in df.iterrows():
            try:
                member_id = str(row.get("member_id", "")).strip()
                member_name = str(row.get("member_name", "")).strip()
                is_fixed = 1 if str(row.get("is_fixed", "1")).strip() == "1" else 0
                remark = str(row.get("remark", "")).strip()

                if not member_name:
                    errors.append(f"Row {idx+2}: missing member name")
                    continue

                session.execute(
                    text("""
                        INSERT IGNORE INTO grp_fixed_member
                            (member_id, member_name, is_fixed, remark)
                        VALUES
                            (:member_id, :member_name, :is_fixed, :remark)
                    """),
                    {
                        "member_id": member_id or None,
                        "member_name": member_name,
                        "is_fixed": is_fixed,
                        "remark": remark,
                    },
                )
                session.commit()
                success += 1
                print(f"  [OK] {member_id} | {member_name}")

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
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT id, member_id, member_name, is_fixed, remark FROM grp_fixed_member"
        ))
        rows = result.fetchall()
        print(f"\ngrp_fixed_member table: {len(rows)} records")
        for r in rows:
            print(f"  id={r[0]} | {r[1]} | {r[2]} | fixed={r[3]} | {r[4]}")


if __name__ == "__main__":
    csv_file = Path(__file__).parent / "fixed_members_test_data.csv"
    print(f"Reading CSV: {csv_file}\n")
    import_fixed_members(str(csv_file))
