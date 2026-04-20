-- ============================================================
-- 008_grp_fixed_member.sql
-- 新建 grp_fixed_member 固定建群成员表
-- 记录每个群的固定成员（报备参与人）基础档案
-- ============================================================

CREATE TABLE IF NOT EXISTS grp_fixed_member (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    member_id       VARCHAR(64) COMMENT '成员ID（可为空）',
    member_name     VARCHAR(128) NOT NULL COMMENT '成员姓名',
    is_fixed        TINYINT(1) DEFAULT 1 COMMENT '是否为固定成员(1=是,0=否)',
    remark          VARCHAR(512) COMMENT '备注',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_member_name (member_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='固定建群成员表';
