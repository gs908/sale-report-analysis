# API 接口文档

本文档列出了系统当前使用的主要数据接口。

> 注意：当前系统采用前端数据模拟层（`src/data/api.ts`），直接调用以下方法获取数据。

## 数据接口列表

### 1. 线索数据接口 (Leads Data)

*   **Endpoint**: `getLeads()`
*   **功能**: 获取全量线索数据。
*   **入参**: 无
*   **返回值**: `Promise<LeadRecord[]>`
*   **返回值属性字段**:
    *   `id`: `string` - 线索唯一编号
    *   `leadName`: `string` - 线索名称
    *   `customerName`: `string` - 客户名称
    *   `person`: `string` - 负责人
    *   `isReported`: `boolean` - 是否已报备
    *   `reportStatus`: `string` - 详细报备状态（如：未报备、已回传-音视频-已处理...）
    *   `groupCount`: `number` - 涉及群数量

### 2. 人员数据接口 (Personnel Data)

*   **Endpoint**: `getPersonnel()`
*   **功能**: 获取全量人员属性数据。
*   **入参**: 无
*   **返回值**: `Promise<PersonnelRecord[]>`
*   **返回值属性字段**:
    *   `name`: `string` - 人员姓名
    *   `isFixedMember`: `boolean` - 是否为固定成员
    *   `involvedGroups`: `number` - 参与群数
    *   `speakingGroups`: `number` - 发言群数
    *   `totalMessages`: `number` - 总消息数

### 3. 数据分析与联动接口 (Analysis Logic)

以下功能封装在 `src/data/api.ts` 中，用于仪表板计算：

*   **`getDashboardStats(leads, personnel)`**: 计算全局总览仪表盘统计数据 (activeLeads, unreported, reported, totalGroupsInvolved)。
*   **`getChartData(leads)`**: 旭日图数据结构转换。
*   **`getUnreportedRanking(leads)`**: 生成未报备线索人员排行列表 ({person, count})。
*   **`getReportedPersonnelStats(leads)`**: 生成核心人员报备量透视 ({person, leadCount, groupCount, audioVideoCount, screenshotCount})。
## 4. 报备信息管理接口 (Report Info)

> 注意：当前使用本地 mock 数据，后续需要对接具体 API。以下为定义标准。

*   **Endpoint**: `GET /api/reports` (列表查询)
*   **功能**: 获取报备信息列表。
*   **返回值**: `ReportRecord[]`
*   **属性字段**:
    *   `id`: `string` - 线索编号
    *   `leadName`: `string` - 线索名称
    *   `customerName`: `string` - 客户名称
    *   `person`: `string` - 负责人
    *   `isReported`: `boolean` - 是否已报备
    *   `isReturned`: `boolean` - 是否已回传
    *   `processingStatus`: `string` - 处理情况
    *   `isVideoGenerated`: `boolean` - 是否生成视频
    *   `isGroupCreated`: `boolean` - 是否建群
    *   `remark`: `string` - 备注

## 5. 群管理接口 (Group Management)

*   **Endpoint**: `GET /api/groups`
    *   **功能**: 获取全量群数据列表。
    *   **返回值**: `GroupRecord[]`
    *   **属性**: `id`, `archiveId`, `name`, `leadId`, `leadName`, `status`, `createdAt`, `dissolvedAt`, `members` (MemberRecord数组)。

*   **Endpoint**: `POST /api/groups` (新增/修改)
    *   **功能**: 创建或更新群配置。
    *   **入参**: `GroupRecord`

*   **Endpoint**: `DELETE /api/groups/{id}/dissolve`
    *   **功能**: 解散群。

*   **Endpoint**: `PUT /api/groups/{groupId}/members/{memberId}`
    *   **功能**: 更新群成员信息。
    *   **入参**: `MemberRecord`

## 6. 群消息管理接口 (Message Management)

*   **Endpoint**: `GET /api/message-groups`
    *   **功能**: 获取已接入消息管理的群列表。
    *   **返回值**: `MsgGroup[]`
    *   **属性**: `id`, `name`, `leadName`, `msgCount`, `lastActive`。

## 7. 消息模板接口 (Template Management)

*   **Endpoint**: `GET /api/templates`
    *   **功能**: 获取全量消息模板列表。
    *   **返回值**: `MsgTemplate[]`
    *   **属性**: `id`, `templateCode`, `name`, `usage`, `content`。

*   **Endpoint**: `POST /api/templates` (新增/修改)
    *   **功能**: 保存或更新模板配置。
    *   **入参**: `MsgTemplate`

*   **Endpoint**: `DELETE /api/templates/{id}`
    *   **功能**: 删除指定模板。
