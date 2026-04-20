# 群消息分析系统 - 后端执行手册

## 环境准备

```bash
cd server
pip install -r requirements.txt
```

确保 `config/database.yaml` 和 `config/llm_config.yaml` 中的连接信息已正确配置。

---

## 四步执行流程

从项目根目录执行：

```bash
# 查看数据库状态
python -m server.test.step_by_step --status

# Step 1: 群消息导入（含 group_info、msg_raw、member 导入）
python -m server.test.step_by_step --step 1
python -m server.test.step_by_step --step 1 --full-reset  # 清空后全量导入

# Step 1.1: 自动识别视频阶段（从 msg_type=video 或内容识别）
python -m server.test.step_by_step --step 1.1
python -m server.test.step_by_step --step 1.1 --group <group_id>  # 单群处理

# Step 2: 标记报备人（参与人 is_participant=1）
python -m server.test.step_by_step --step 2
python -m server.test.step_by_step --step 2 --auto --clue-file <path>  # 自动从报备文件解析

# Step 3: LLM 分析（只处理活跃群组的非参与人消息）
python -m server.test.step_by_step --step 3           # 增量模式
python -m server.test.step_by_step --step 3 --force   # 强制重跑
python -m server.test.step_by_step --step 3 --group <group_id>  # 单群分析

# Step 4: 双维度统计分析（按群统计 + 按人统计）
python -m server.test.step_by_step --step 4

# 指定 Excel 文件路径
python -m server.test.step_by_step --file <path> --step 1
```

---

## 各步骤详细说明

### --status

查看当前数据库中各表的记录数量和状态概览。

```
grp_group_info:      N 条  — 群信息表
grp_msg_raw:         N 条  — 消息原始表（含已删除）
grp_group_member:    N 条  — 群成员表（含拼音ID映射）
grp_msg_marked:      N 条  — LLM 分析结果
grp_video_stage:     N 条  — 视频阶段表
grp_group_msg_stat:  N 条  — 按群统计结果
grp_person_stats:    N 条  — 按人统计结果
```text

---

### --step 1 群消息导入

```bash
python -m server.test.step_by_step --file <path> --step 1
python -m server.test.step_by_step --step 1 --full-reset  # 清空后全量导入
```

**功能说明：**
- 解析 Excel/CSV 群消息文件
- 自动导入/更新三个表：
  - `grp_group_info` — 群基础信息
  - `grp_msg_raw` — 消息原始记录（含撤回标记处理）
  - `grp_group_member` — 群成员（拼音ID自动映射中文名）

**特殊处理：**
1. **撤回消息识别**：检测 `msg_type='revoke'` 且内容为空的消息，自动标记上一条消息 `is_deleted=1`
2. **拼音映射**：发送人ID（拼音）通过 `PINYIN_TO_CHINESE_MAP` 映射为中文名存储
3. **增量支持**：`INSERT IGNORE` 跳过已存在的 `msg_id` 和 `group_id`+`member_id`

**主要实现：** `modules/excel/importer.py` → `import_batch()`

---

### --step 1.1 自动识别视频阶段

```bash
python -m server.test.step_by_step --step 1.1              # 处理所有群组
python -m server.test.step_by_step --step 1.1 --group <id> # 处理指定群组
```

**功能说明：**
自动识别群讨论阶段，以视频推送消息为边界划分：
- 识别规则（优先级）：
  1. `msg_type='video'` 的消息
  2. 发送人为"融鑫小R"等系统账号 + 内容包含视频链接
  3. 内容匹配视频关键词（视频、http、watch?v= 等）

**阶段划分：**
- Stage 0: 建群时间 ~ 第一个视频推送时间
- Stage 1: 第一个视频推送 ~ 第二个视频推送
- ...以此类推

**数据写入：** `grp_video_stage`（group_id, stage_index, video_push_time, video_title）

**主要实现：** `modules/stage_detector.py` → `detect_and_save_stages()`

---

### --step 2 标记报备人

```bash
python -m server.test.step_by_step --step 2                # 列出待标记清单（手动模式）
python -m server.test.step_by_step --step 2 --auto          # 从默认台账文件自动标记
python -m server.test.step_by_step --step 2 --auto --clue-file <路径>  # 指定台账文件
```

**功能说明：**
在 `grp_group_member` 表中标记 `is_participant=1`（参与人），这些成员的发言在LLM分析和统计中会排除。

**自动模式说明：**
1. 读取台账文件（默认：`server/data/售前交流台账.xlsx`）
2. 解析"我方人员姓名"字段（支持顿号`、`和逗号`,`分隔）
3. 根据"客户及线索名称"匹配群名称（支持WT-xxx工单号自动去除）
4. 匹配到的成员自动标记 `is_participant=1`

**台账文件格式要求：**
| 字段 | 说明 |
|------|------|
| `客户及线索名称` | 群名称，用于匹配群组 |
| `我方人员姓名` | 参与人员列表，顿号/逗号分隔（如：张誉02、曹可心、田军） |

**参与人标记影响：**
- LLM分析：排除参与人的消息
- 统计分析：参与人不计入"需发言人数"
- 阶段回复统计：不参与回复统计

**主要实现：** `test/step_by_step.py` → `step2_mark_participants()`

---

### --step 3 LLM 消息分析

```bash
python -m server.test.step_by_step --step 3              # 增量分析（仅新消息）
python -m server.test.step_by_step --step 3 --force      # 强制重分析所有消息
python -m server.test.step_by_step --step 3 --group <id> # 仅分析指定群组
```

**筛选条件（同时满足）：**
1. 群组状态 `status='active'`（只分析活跃群）
2. 消息 `is_deleted=0`（未撤回删除）
3. 消息 `msg_type='text'`（文本类型）
4. 发送人非参与人（`grp_group_member.is_participant=0`）

**分析流程：**
1. **预过滤**（本地）：≤5字符且命中黑名单（"收到"、"好"、"1"等）→ 直接标记"无意义"
2. **LLM分批**：
   - ≤35条 → 一次性发送
   - >35条 → 每15条一组
3. **入库**：`grp_msg_marked` 一对一关联 `grp_msg_raw`

**分析结果标签：**
- `有实质建议` — 有建设性的业务建议
- `无意义` — 纯表态、简短回应
- `其他` — 不符合上述分类

**主要实现：** `modules/llm/analyzer.py` → `analyze_group_messages()`

**LLM Provider：** 火山引擎（配置在 `config/llm_config.yaml`）

---

### --step 4 双维度统计分析

```bash
python -m server.test.step_by_step --step 4
```

**功能说明：**
计算并保存两类统计结果：

#### 维度 1: 按群统计 → `grp_group_msg_stat`

| 指标 | 说明 |
|------|------|
| 需发言人数 | 群成员中非参与人的数量 |
| 实际发言人数 | 有消息记录的非参与人数 |
| 有实质建议数 | 标记为"有实质建议"的消息数 |
| 无意义数 | 标记为"无意义"的消息数 |

#### 维度 2: 按人统计 → `grp_person_stats`

| 指标 | 说明 |
|------|------|
| 参与群数 | 该成员加入的非参与人群组数 |
| 有发言群数 | 该成员在多少个群发过消息 |
| 有实质建议群数 | 该成员在多少群有"有实质建议"发言 |
| 发言占比 | 有发言群数 / 参与群数（百分比）|
| 实质发言占比 | 有实质建议群数 / 参与群数（百分比）|
| 实质发言消息总数 | 所有"有实质建议"消息的总数 |

**注意：** 占比按**群数**统计，不是按消息数统计。

**主要实现：** `test/step_by_step.py` → `step4_statistics()`

---

## 配置文件

| 文件 | 用途 |
|------|------|
| `config/database.yaml` | MySQL 连接信息（host/port/user/password/db） |
| `config/llm_config.yaml` | 火山引擎 API base_url / model / api_key |
| `config/llm_config.yaml` → `batch.small_threshold` | ≤此值一次性发送（默认35） |
| `config/llm_config.yaml` → `batch.large_batch_size` | >threshold 时的分组大小（默认15） |

---

## 数据库表结构

### 核心表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `grp_group_info` | 群基础信息 | group_id, group_name, issue_id, **status** |
| `grp_msg_raw` | 消息原始表 | msg_id, group_id, sender, **is_deleted**, msg_type |
| `grp_group_member` | 群成员表 | group_id, **member_id**, **member_name**, is_participant |
| `grp_msg_marked` | LLM分析结果 | msg_raw_id, tag, reason |
| `grp_video_stage` | 视频阶段表 | group_id, stage_index, video_push_time |
| `grp_group_msg_stat` | 按群统计 | group_id, total_replies, valid_replies |
| `grp_person_stats` | 按人统计 | member_name, total_groups, speech_rate, meaningful_rate |

### 字段说明

#### grp_group_info.status
- `active` — 活跃中（默认），参与LLM分析和统计
- `dissolved` — 已解散（售前完成后群解散）
- `closed` — 已关闭（不再活跃但未解散）

#### grp_msg_raw.is_deleted
- `0` — 正常消息
- `1` — 被撤回删除（通过 `msg_type='revoke'` 自动识别）

#### grp_group_member 成员ID映射
- `member_id` — 拼音ID（如 zhangyu02）
- `member_name` — 中文名（如 张誉02），通过 `PINYIN_TO_CHINESE_MAP` 映射

---

## API 服务启动

```bash
cd server
uvicorn main:app --reload --port 8000
```

启动后访问 http://localhost:8000/docs 查看 FastAPI 在线文档。

---

## 拼音-中文名映射表

在 `modules/excel/importer.py` 中预置了映射关系：

```python
PINYIN_TO_CHINESE_MAP = {
    'zhangyu02': '张誉02',
    'caokexin': '曹可心',
    'tianjun': '田军',
    ...
}
```

未匹配到的发送人ID，将使用原ID作为 member_name。
