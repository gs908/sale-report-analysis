import api from '../lib/axios';

// Helper: cast axios response through interceptor return
// The interceptor returns payload.data, but TypeScript infers AxiosResponse
// Use this pattern: getXxx().then(res => (res as { field: T[] }).field)
type PromiseData<T> = Promise<T>;

// Groups
export interface PageResult<T> {
  total: number;
  current: number;
  size: number;
  list: T[];
}

export const getGroups = (params?: { current?: number; size?: number }): Promise<PageResult<GroupRecord>> =>
  api.get('/api/admin/groups', { params }).then((res: any) => res as PageResult<GroupRecord>);
export const createGroup = (data: unknown) => api.post('/api/admin/groups', data) as unknown as PromiseData<{ id: string }>;
export const updateGroup = (id: string, data: unknown) => api.put(`/api/admin/groups/${id}`, data) as unknown as PromiseData<void>;
export const dissolveGroup = (id: string) => api.put(`/api/admin/groups/${id}/dissolve`, {}) as unknown as PromiseData<void>;

// Members within group
export const addGroupMember = (groupId: string, data: unknown) => api.post(`/api/admin/groups/${groupId}/members`, data) as unknown as PromiseData<{ id: string }>;
export const updateGroupMember = (groupId: string, memberId: string, data: unknown) => api.put(`/api/admin/groups/${groupId}/members/${memberId}`, data) as unknown as PromiseData<void>;
export const removeGroupMember = (groupId: string, memberId: string) => api.delete(`/api/admin/groups/${groupId}/members/${memberId}`) as unknown as PromiseData<void>;

// Templates
export const getTemplates = (params?: { current?: number; size?: number }): Promise<PageResult<MsgTemplate>> =>
  api.get('/api/admin/templates', { params }).then((res: any) => res as PageResult<MsgTemplate>);
export const createTemplate = (data: unknown) => api.post('/api/admin/templates', data) as unknown as PromiseData<{ id: string }>;
export const updateTemplate = (id: string, data: unknown) => api.put(`/api/admin/templates/${id}`, data) as unknown as PromiseData<void>;
export const deleteTemplate = (id: string) => api.delete(`/api/admin/templates/${id}`) as unknown as PromiseData<void>;

// Dictionary Types
export const getDictTypes = (params?: { current?: number; size?: number }): Promise<PageResult<DictType>> =>
  api.get('/api/admin/dicts/types', { params }).then((res: any) => res as PageResult<DictType>);
export const createDictType = (data: unknown) => api.post('/api/admin/dicts/types', data) as unknown as PromiseData<{ id: string }>;
export const updateDictType = (id: string, data: unknown) => api.put(`/api/admin/dicts/types/${id}`, data) as unknown as PromiseData<void>;
export const deleteDictType = (id: string) => api.delete(`/api/admin/dicts/types/${id}`) as unknown as PromiseData<void>;

// Dictionary Items
export const getDictItems = (typeCode: string, params?: { current?: number; size?: number }): Promise<PageResult<DictItem>> =>
  api.get(`/api/admin/dicts/items/${typeCode}`, { params }).then((res: any) => res as PageResult<DictItem>);
export const createDictItem = (data: unknown) => api.post('/api/admin/dicts/items', data) as unknown as PromiseData<{ id: string }>;
export const updateDictItem = (id: string, data: unknown) => api.put(`/api/admin/dicts/items/${id}`, data) as unknown as PromiseData<void>;
export const deleteDictItem = (id: string) => api.delete(`/api/admin/dicts/items/${id}`) as unknown as PromiseData<void>;

// Fixed Members
export const getFixedMembers = (params?: { current?: number; size?: number }): Promise<PageResult<FixedMember>> =>
  api.get('/api/admin/fixed-members', { params }).then((res: any) => res as PageResult<FixedMember>);
export const createFixedMember = (data: unknown) => api.post('/api/admin/fixed-members', data) as unknown as PromiseData<{ id: string }>;
export const updateFixedMember = (id: string, data: unknown) => api.put(`/api/admin/fixed-members/${id}`, data) as unknown as PromiseData<void>;
export const deleteFixedMember = (id: string) => api.delete(`/api/admin/fixed-members/${id}`) as unknown as PromiseData<void>;

// Reports
export const getReports = (params?: { current?: number; size?: number }): Promise<PageResult<ReportRecord>> =>
  api.get('/api/admin/reports', { params }).then((res: any) => res as PageResult<ReportRecord>);
export const createReport = (data: unknown) => api.post('/api/admin/reports', data) as unknown as PromiseData<{ id: string }>;
export const updateReport = (id: string, data: unknown) => api.put(`/api/admin/reports/${id}`, data) as unknown as PromiseData<void>;
export const deleteReport = (id: string) => api.delete(`/api/admin/reports/${id}`) as unknown as PromiseData<void>;

// Message Groups
export const getMessageGroups = (params?: { current?: number; size?: number }): Promise<PageResult<MsgGroup>> =>
  api.get('/api/admin/message-groups', { params }).then((res: any) => res as PageResult<MsgGroup>);

// Shared types
export interface GroupRecord {
  id: string; archiveId: string; name: string; leadId: string; leadName: string;
  status: '正常' | '已解散'; createdAt: string; dissolvedAt?: string; members: MemberRecord[];
}
export interface MemberRecord {
  id: string; name: string; isFixed: boolean; department: string;
}
export interface DictType { id: number; typeCode: string; typeName: string; description: string; status: string; createdAt: string; updatedAt: string; }
export interface DictItem { id: number; typeCode: string; itemCode: string; itemName: string; sortOrder: number; status: string; createdAt: string; updatedAt: string; }
export interface FixedMember { id: string; name: string; department: string; role: string; }
export interface MsgTemplate { id: string; templateCode: string; name: string; usage?: string; content: string; }
export interface ReportRecord {
  id: string; leadName: string; customerName: string; person: string;
  isReported: boolean; isReturned: boolean; processingStatus: string;
  isVideoGenerated: boolean; isGroupCreated: boolean; remark: string;
}
export interface MsgGroup { id: string; name: string; leadName: string; msgCount: number; lastActive: string; }
