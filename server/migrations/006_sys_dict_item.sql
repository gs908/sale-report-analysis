-- ============================================================
-- 006_sys_dict_item.sql
-- 新建 sys_dict_item 字典明细表
-- ============================================================

CREATE TABLE IF NOT EXISTS sys_dict_item (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    type_code       VARCHAR(64) NOT NULL COMMENT '所属字典类型编码',
    item_code       VARCHAR(64) NOT NULL COMMENT '字典项编码',
    item_name       VARCHAR(128) NOT NULL COMMENT '字典项名称',
    sort_order      INT DEFAULT 0 COMMENT '排序',
    status          VARCHAR(16) DEFAULT 'active' COMMENT '状态: active/disabled',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_type_item (type_code, item_code),
    INDEX idx_type_code (type_code),
    CONSTRAINT fk_dict_item_type FOREIGN KEY (type_code)
        REFERENCES sys_dict_type(type_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典明细表';
