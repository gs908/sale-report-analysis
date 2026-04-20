-- ============================================================
-- 批量更新 grp_group_member 表 member_name
-- 将拼音 ID 映射为中文名
-- ============================================================

-- 定义更新映射
-- wangfengchao -> 王凤朝
-- zhangmiaomiao -> 张苗苗
-- mengfanyu -> 孟凡雨
-- sunhui -> 孙慧
-- shimengmeng -> 史蒙蒙
-- gansujuan -> 甘素娟

UPDATE grp_group_member
SET member_name = '王凤朝'
WHERE member_id = 'wangfengchao' AND member_name != '王凤朝';

UPDATE grp_group_member
SET member_name = '张苗苗'
WHERE member_id = 'zhangmiaomiao' AND member_name != '张苗苗';

UPDATE grp_group_member
SET member_name = '孟凡雨'
WHERE member_id = 'mengfanyu' AND member_name != '孟凡雨';

UPDATE grp_group_member
SET member_name = '孙慧'
WHERE member_id = 'sunhui' AND member_name != '孙慧';

UPDATE grp_group_member
SET member_name = '史蒙蒙'
WHERE member_id = 'shimengmeng' AND member_name != '史蒙蒙';

UPDATE grp_group_member
SET member_name = '甘素娟'
WHERE member_id = 'gansujuan' AND member_name != '甘素娟';

-- 验证更新结果
SELECT
    member_id,
    member_name,
    COUNT(*) as count
FROM grp_group_member
WHERE member_id IN (
    'wangfengchao',
    'zhangmiaomiao',
    'mengfanyu',
    'sunhui',
    'shimengmeng',
    'gansujuan'
)
GROUP BY member_id, member_name
ORDER BY member_id;
