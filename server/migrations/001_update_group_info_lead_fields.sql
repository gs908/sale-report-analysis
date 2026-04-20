-- ============================================================
-- 001_update_group_info_lead_fields.sql
-- 更新 grp_group_info 表：clue_id → lead_id, clue_name → lead_name
-- 同时补充 archive_id、dissolved_at 字段
-- ============================================================

-- 新增 archive_id 字段（如已存在则跳过）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'salers' AND TABLE_NAME = 'grp_group_info' AND COLUMN_NAME = 'archive_id');
SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'ALTER TABLE grp_group_info ADD COLUMN archive_id VARCHAR(64) COMMENT ''归档ID'' AFTER group_id');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 新增 dissolved_at 字段（如已存在则跳过）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'salers' AND TABLE_NAME = 'grp_group_info' AND COLUMN_NAME = 'dissolved_at');
SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'ALTER TABLE grp_group_info ADD COLUMN dissolved_at DATETIME COMMENT ''解散时间'' AFTER status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 重命名字段 clue_id → lead_id, clue_name → lead_name
ALTER TABLE grp_group_info
  CHANGE COLUMN clue_id lead_id VARCHAR(64) COMMENT '关联线索ID',
  CHANGE COLUMN clue_name lead_name VARCHAR(255) COMMENT '关联线索名称';
