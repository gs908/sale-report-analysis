-- ============================================================
-- 003_crm_report.sql
-- 新建 crm_report 报备信息表
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_report (
    id                  VARCHAR(64) PRIMARY KEY COMMENT '报备编号',
    lead_id             VARCHAR(64) COMMENT '关联线索ID',
    lead_name           VARCHAR(255) COMMENT '线索名称（冗余存储）',
    customer_name       VARCHAR(255) COMMENT '客户名称',
    person              VARCHAR(128) COMMENT '负责人',
    is_reported         TINYINT(1) DEFAULT 0 COMMENT '是否已报备(1=是,0=否)',
    is_returned         TINYINT(1) DEFAULT 0 COMMENT '是否已回传(1=是,0=否)',
    processing_status   VARCHAR(64) COMMENT '处理情况（如：未处理/处理中/已完成）',
    is_video_generated  TINYINT(1) DEFAULT 0 COMMENT '是否生成视频(1=是,0=否)',
    is_group_created    TINYINT(1) DEFAULT 0 COMMENT '是否建群(1=是,0=否)',
    remark              TEXT COMMENT '备注',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lead_id (lead_id),
    INDEX idx_person (person),
    INDEX idx_is_reported (is_reported)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报备信息表';
