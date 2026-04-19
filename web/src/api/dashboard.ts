import api from '../lib/axios';
import type { LeadRecord, PersonnelRecord } from '../types';

export const getLeads = (): Promise<LeadRecord[]> =>
  api.get('/api/dashboard/leads').then((res: any) => (res as { leads: LeadRecord[] }).leads);

export const getPersonnel = (): Promise<PersonnelRecord[]> =>
  api.get('/api/dashboard/personnel').then((res: any) => (res as { personnel: PersonnelRecord[] }).personnel);

export const getReports = (): Promise<any[]> =>
  api.get('/api/dashboard/reports').then((res: any) => (res as { reports: any[] }).reports);

export const getMessageGroups = (): Promise<any[]> =>
  api.get('/api/dashboard/message-groups').then((res: any) => (res as { groups: any[] }).groups);
