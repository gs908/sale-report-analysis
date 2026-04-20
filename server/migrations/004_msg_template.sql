-- ============================================================
-- 004_msg_template.sql
-- 新建 msg_template 消息模板表
-- ============================================================

CREATE TABLE IF NOT EXISTS msg_template (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    template_code   VARCHAR(64) NOT NULL UNIQUE COMMENT '模板编码',
    name            VARCHAR(128) NOT NULL COMMENT '模板名称',
    `usage`         INT DEFAULT 0 COMMENT '使用次数',
    content         TEXT NOT NULL COMMENT '模板内容',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_code (template_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息模板表';
