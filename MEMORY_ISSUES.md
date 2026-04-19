# 前后端联调问题记录

## 核心障碍

### 1. 前端 Mock 数据未替换 ✅ 已解决
- Task 4 axios 改造已完成（见下方）

### 2. 字段命名风格不一致 ✅ 已解决
- 后端 Pydantic Schema 已全部改为 camelCase（Task 1 完成）
- Service 层 snake_case 调用 + Field alias，JSON 输出自动为 camelCase
- curl 验证：`/api/admin/groups` 返回 `archiveId`、`leadId`、`memberName`、`isParticipant` 等

### 3. 接口路径差异
| 前端期望 | 后端实际 | 状态 |
|---------|---------|------|
| GET /api/reports | GET /api/dashboard/reports | ✅ 已对齐 |
| GET /api/groups | GET /api/admin/groups | ✅ 已对齐 |
| GET /api/templates | GET /api/admin/templates | ✅ 已对齐 |
| GET /api/message-groups | GET /api/dashboard/message-groups | ✅ 已对齐 |
| GET /api/dicts/types | GET /api/admin/dicts/types | ✅ 已对齐 |

### 4. 数据结构不完整
- **已解决**：GroupRecord、MemberRecord 字段名已对齐
- **仍存在**：前端 MemberRecord 缺少 `memberId`（拼音ID）字段，`department`（序列）字段后端无
- **需处理**：前端 `GroupManagement` 的 `MemberRecord.department` 字段与后端不兼容

### 5. 缺少接口 ✅ 已解决
- ReportInfoManagement → `/api/dashboard/reports` ✅
- FixedMemberManagement → `/api/admin/fixed-members`（CRUD）✅ 已实现（2026-04-19）
  - 新增文件：schemas/admin/fixed_member.py、services/admin/fixed_member_service.py、routers/admin/fixed_members.py
  - 验证通过：GET/POST/PUT/DELETE 全部 200

---

## 待办任务

### Task 1: 后端 Pydantic Schema 统一改为 camelCase ✅ 已完成
- 负责人: AI
- 状态: 已完成 (2026-04-19)
- 实现: Pydantic Field alias + populate_by_name，Service 层 snake_case 调用无需改动
- 验证: curl 测试 /api/admin/groups 返回字段名全为 camelCase (archiveId, leadId, memberId, isParticipant 等)
- 注意: model_dump() 默认输出 Python 属性名（camelCase），无需 by_alias 参数

### Task 2: 前端 Dashboard 页面 API 需求确认 ✅ 已完成
- 状态: 已完成 (2026-04-19)
- 结论: Dashboard 只需 2 个 API (`/api/dashboard/leads` + `/api/dashboard/personnel`)，所有图表计算均为 client-side
- Admin 页面缺失: FixedMemberManagement.tsx 需要新建 `/api/admin/fixed-members` CRUD 接口
- 差异: ReportInfoManagement 页面字段与后端 ReportRecord 完全对齐

### Task 3: 后端表设计冗余字段优化建议 ✅ 已完成
- 状态: 已完成 (2026-04-19)
- 分析结果见下方"表设计冗余分析"章节

### Task 4: 前端 axios 改造方案 ✅ 已完成
- 状态: 已完成 (2026-04-19)
- 方案内容见下方"前端 axios 改造方案"章节

**实际执行结果（2026-04-19）：**
- 安装 `axios`
- 新建 `src/lib/axios.ts`（axios 实例 + 响应拦截器）
- 新建 `src/api/dashboard.ts`（Dashboard API）
- 新建 `src/api/admin.ts`（Admin API，含所有 CRUD 方法）
- `src/data/api.ts` → `src/lib/stats.ts`（纯数据转换函数）
- `src/App.tsx` import 更新为 `./api/dashboard` + `./lib/stats`
- 所有 Admin 页面改造为 API 调用（GroupManagement、MessageManagement、ReportInfoManagement、TemplateManagement、DictionaryManagement、FixedMemberManagement）
- 所有 TypeScript 类型统一从 `api/admin.ts` 导出

---

## 字段名对照表（已同步为实际 Schema 字段）

### Dashboard API

| 后端 Schema Python 属性（alias） | JSON 输出字段名（camelCase） | 前端 TypeScript |
|-------------------------------|--------------------------|----------------|
| `lead_name` | `leadName` | `leadName` |
| `customer_name` | `customerName` | `customerName` |
| `is_reported` | `isReported` | `isReported` |
| `report_status` | `reportStatus` | `reportStatus` |
| `group_count` | `groupCount` | `groupCount` |
| `is_fixed_member` | `isFixedMember` | `isFixedMember` |
| `involved_groups` | `involvedGroups` | `involvedGroups` |
| `speaking_groups` | `speakingGroups` | `speakingGroups` |
| `total_messages` | `totalMessages` | `totalMessages` |
| `msg_count` | `msgCount` | `msgCount` |
| `last_active` | `lastActive` | `lastActive` |

### Admin API

| 后端 Schema Python 属性（alias） | JSON 输出字段名（camelCase） | 前端 TypeScript |
|-------------------------------|--------------------------|----------------|
| `archive_id` | `archiveId` | `archiveId` |
| `lead_id` | `leadId` | `leadId` |
| `lead_name` | `leadName` | `leadName` |
| `created_at` | `createdAt` | `createdAt` |
| `dissolved_at` | `dissolvedAt` | `dissolvedAt` |
| `group_id` | `groupId` | （内部使用） |
| `member_id` | `memberId` | （内部使用） |
| `member_name` | `memberName` | `memberName` |
| `is_participant` | `isParticipant` | `isParticipant` |
| `template_code` | `templateCode` | `templateCode` |
| `type_code` | `typeCode` | `typeCode` |
| `item_code` | `itemCode` | `itemCode` |
| `sort_order` | `sortOrder` | `sortOrder` |

### 前端 GroupManagement MemberRecord 特殊说明

前端 `MemberRecord` 字段 `department`（序列）后端 `GrpGroupMember` 和 `GrpFixedMember` 均无对应字段，
需在 FixedMemberManagement 接口实现时统一约定，或在前端新增/删除该字段。

---

## 表设计冗余分析

### 核心结论

当前数据库设计存在多处冗余，主要问题：**统计数据既存在于预计算表（`grp_person_stats`、`grp_group_msg_stat`）又从原始消息实时聚合**。这导致：

1. **数据一致性风险**：预计算表与实时聚合结果可能不一致
2. **维护负担**：每次原始数据变更需同时更新预计算表
3. **准确性存疑**：预计算表是否被正确更新无法保证

### 详细分析

#### 冗余类型 A：预计算表 vs 实时聚合（数据源已有）

| 预计算表 | 实时聚合来源 | 现状问题 |
|---------|------------|---------|
| `grp_person_stats`（按人统计跨群） | `grp_group_member` + `grp_msg_raw` 实时 `GROUP BY member_name` | `personnel_service.py` 已直接聚合原始表，预计算表**未被使用** |
| `grp_group_msg_stat`（按群统计） | `grp_msg_raw` 实时 `GROUP BY group_id` | `message_group_service.py` 已直接聚合，预计算表**未被使用** |

**建议：这两个预计算表可删除，或明确其用途（如定时批任务生成报表快照）**

#### 冗余类型 B：表内字段重复

| 表 | 冗余字段 | 说明 |
|----|---------|------|
| `grp_group_info` | `lead_name` | `lead_name` 冗余 — `lead_id` 已足够，通过 `crm_lead.id` 可 JOIN 获取 |
| `crm_report` | `lead_id` + `lead_name` | 线索名称冗余 — `lead_id` → `crm_lead` 可 JOIN 获取 |
| `crm_report` | `is_reported` | 可由 `crm_lead.status` 判断（status != 'active' 即已报备），但当前 `lead_service.py` 也是直接从 `crm_lead.status` 读取，说明 `is_reported` 字段**未被使用** |

#### 冗余类型 C：导入来源冗余

| 表 | 冗余字段 | 说明 |
|----|---------|------|
| `grp_group_info` | `raw_file` | 字段存在但从未被使用（导入后不再引用） |

### 建议保留的优化方案（不改结构，清理语义）

**不建议做大幅度表结构变更（涉及数据迁移），但在 Service 层可以统一数据来源：**

1. **统一 personnel 数据来源**：删除或忽略 `grp_person_stats`，只用 `grp_group_member` + `grp_msg_raw` 实时聚合（当前 `personnel_service.py` 已这样实现）
2. **删除 `grp_group_msg_stat`**：未被任何 Service 使用，可作为废弃表保留
3. **`grp_group_info.lead_name`**：保留（避免 JOIN），作为冗余字段在文档中标注
4. **`crm_report.is_reported`**：保留，当前后端直接从 `crm_lead.status` 读取，不依赖此字段

### 最需要关注的问题：`grp_fixed_member` 的前端对接

`grp_fixed_member` 表已创建，但：
- 没有 Service 层
- 没有 Router 层
- 前端 FixedMemberManagement.tsx 页面使用 mock 数据
- 需要新建 API: `GET/POST/PUT/DELETE /api/admin/fixed-members`

---

## 前端 axios 改造方案

### 现状分析

- `api.ts` 所有接口返回 mock 数据（`mockLeads` / `mockPersonnel`）
- 前端 `Dashboard` 页面调用 `getLeads()` 和 `getPersonnel()` 获取数据
- `mock.ts` 包含完整 mock 数据，直接解析返回（200ms 延迟模拟）
- `types.ts` 定义了前端 TypeScript 类型（camelCase）

### axios 改造原则

1. **保持 `api.ts` 接口签名不变**，只改内部实现
2. **新增 axios 实例配置文件** `src/lib/axios.ts`
3. **统一错误处理**：非 0 响应 → notification.error 提示
4. **统一响应解析**：后端返回 `{ code, data, msg }`，解包后只返回 `data`
5. **mock 数据逐步替换**：先替换 Dashboard（风险最低），再替换 Admin 页面

### 目录结构

```
web/src/
├── lib/
│   └── axios.ts          # axios 实例 + 响应拦截器（新增）
├── data/
│   ├── api.ts            # API 方法（改造：mock → axios）
│   └── mock.ts          # 保留，用于开发环境 fallback（可选）
└── types.ts             # 已存在
```

### 步骤一：创建 axios 实例

```typescript
// src/lib/axios.ts
import axios from 'axios';
import { notification } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765',
  timeout: 15000,
});

// 响应拦截器：解包 { code, data, msg }
api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload.code !== 0) {
      notification.error({ message: '请求失败', description: payload.msg || '未知错误' });
      return Promise.reject(payload);
    }
    return payload.data;
  },
  (error) => {
    notification.error({ message: '网络错误', description: error.message });
    return Promise.reject(error);
  }
);

export default api;
```

### 步骤二：改造 api.ts（Dashboard 优先）

**改造前：**
```typescript
export const getLeads = async (): Promise<LeadRecord[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockLeads), 200));
};
```

**改造后：**
```typescript
import api from '../lib/axios';
import type { LeadRecord } from '../types';

export const getLeads = async (): Promise<LeadRecord[]> => {
  const res = await api.get<{ leads: LeadRecord[]; total: number }>('/api/dashboard/leads');
  return res.leads;
};

export const getPersonnel = async (): Promise<PersonnelRecord[]> => {
  const res = await api.get<{ personnel: PersonnelRecord[]; total: number }>('/api/dashboard/personnel');
  return res.personnel;
};
```

### 步骤三：Admin 页面接口映射

| 页面 | 当前 mock 变量 | 替换为 axios 调用 |
|------|-------------|----------------|
| GroupManagement | `mockGroups`（本地 useState） | `GET /api/admin/groups` |
| MessageManagement | `mockGroups` | `GET /api/dashboard/message-groups` |
| ReportInfoManagement | `mockData` | `GET /api/dashboard/reports` |
| TemplateManagement | `mockTemplates` | `GET /api/admin/templates` |
| DictionaryManagement | `mockDictTypes` / `mockDictItems` | `/api/admin/dicts/types` + `/api/admin/dicts/items/{typeCode}` |
| FixedMemberManagement | `mockFixedMembers` | `GET /api/admin/fixed-members`（需后端先实现） |

### 步骤四：安装 axios

```bash
cd web
npm install axios
```

### 注意事项

1. **环境变量配置**：`.env` 或 `.env.example` 需添加 `VITE_API_BASE_URL=http://localhost:8765`
2. **后端 CORS**：FastAPI 需配置 CORS 中间件，允许前端 origin
3. **FixedMemberManagement**：此页面依赖后端先实现 `/api/admin/fixed-members` 接口才能完全对接
4. **DictionaryManagement**：树形联动需要 2 个 API 调用（types + items by typeCode）
5. **PipelineManagement / AgentRegistration**：暂不改造（功能未知）
