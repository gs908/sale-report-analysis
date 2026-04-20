-- ============================================================
-- 002_crm_lead.sql
-- 新建 crm_lead 线索主表
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_lead (
    id              VARCHAR(64) PRIMARY KEY COMMENT '线索唯一编号',
    lead_name       VARCHAR(255) NOT NULL COMMENT '线索名称',
    customer_name   VARCHAR(255) COMMENT '客户名称',
    person          VARCHAR(128) COMMENT '负责人',
    status          VARCHAR(32) DEFAULT 'active' COMMENT '线索状态: active/已报备/已成交/已关闭',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_person (person),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='线索主表';
