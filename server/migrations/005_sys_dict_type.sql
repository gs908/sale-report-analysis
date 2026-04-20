-- ============================================================
-- 005_sys_dict_type.sql
-- 新建 sys_dict_type 字典类型表
-- ============================================================

CREATE TABLE IF NOT EXISTS sys_dict_type (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    type_code       VARCHAR(64) NOT NULL UNIQUE COMMENT '字典类型编码',
    type_name       VARCHAR(128) NOT NULL COMMENT '字典类型名称',
    description     VARCHAR(255) COMMENT '说明',
    status          VARCHAR(16) DEFAULT 'active' COMMENT '状态: active/disabled',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类型表';
