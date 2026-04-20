-- ============================================================
-- 007_sys_dict_init_data.sql
-- 字典表初始数据
-- ============================================================

-- 字典类型初始化
INSERT INTO sys_dict_type (type_code, type_name, description) VALUES
('lead_status', '线索状态', '线索的运营状态'),
('report_status', '报备状态', '报备处理阶段'),
('group_status', '群状态', '群的生命周期状态'),
('msg_tag', '消息标签', 'LLM消息分析标签'),
('processing_status', '处理情况', '报备处理进度')
ON DUPLICATE KEY UPDATE type_name = VALUES(type_name);

-- 字典明细初始化
INSERT INTO sys_dict_item (type_code, item_code, item_name, sort_order) VALUES
-- 线索状态
('lead_status', 'active', '跟进中', 1),
('lead_status', 'reported', '已报备', 2),
('lead_status', 'closed', '已关闭', 3),

-- 报备状态
('report_status', 'unreported', '未报备', 1),
('report_status', 'reported', '已报备', 2),
('report_status', 'returned', '已回传', 3),

-- 群状态
('group_status', 'active', '活跃中', 1),
('group_status', 'dissolved', '已解散', 2),
('group_status', 'closed', '已关闭', 3),

-- 消息标签
('msg_tag', 'meaningful', '有实质建议', 1),
('msg_tag', 'meaningless', '无意义', 2),
('msg_tag', 'other', '其他', 3),

-- 处理情况
('processing_status', 'pending', '未处理', 1),
('processing_status', 'processing', '处理中', 2),
('processing_status', 'completed', '已完成', 3)
ON DUPLICATE KEY UPDATE item_name = VALUES(item_name);
