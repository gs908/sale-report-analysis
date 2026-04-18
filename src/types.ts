/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 报备回传的层级状态
export type ReportStatus = 
  | '未报备'
  | '未回传'
  | '已回传-已中标'
  | '已回传-截图'
  | '已回传-音视频-无法处理'
  | '已回传-音视频-已处理-角色判定'
  | '已回传-音视频-已处理-正常进行'
  | '已回传-音视频-已处理-正常分析-生成视频'
  | '已回传-音视频-已处理-正常分析-处理中';

export interface LeadRecord {
  id: string;
  leadName: string;      // 线索名称
  customerName: string;  // 客户名称
  person: string;        // 负责人
  isReported: boolean;   // 是否报备
  reportStatus: ReportStatus; 
  groupCount: number;    // 涉及群数
  remarks?: string;      // 备注
}

export interface PersonnelRecord {
  name: string;
  department?: string;
  isFixedMember: boolean; // 固定进群人员
  involvedGroups: number; // 所在群数
  speakingGroups: number; // 发言群数
  totalMessages: number;  // 消息总数
}

// Data fetching layer interfaces
export interface DashboardStats {
  totalActiveLeads: number;
  unreportedCount: number;
  reportedCount: number;
  totalGroupsInvolved: number;
}
