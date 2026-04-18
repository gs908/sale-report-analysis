import { LeadRecord, PersonnelRecord, DashboardStats } from '../types';
import { mockLeads, mockPersonnel } from './mock';

// Fetch all leads
export const getLeads = async (): Promise<LeadRecord[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockLeads), 200));
};

// Fetch all personnel
export const getPersonnel = async (): Promise<PersonnelRecord[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockPersonnel), 200));
};

// Calculate all summary stats
export const getDashboardStats = async (leads: LeadRecord[], personnel: PersonnelRecord[]) => {
  const unreportedCount = leads.filter(l => !l.isReported).length;
  const reportedCount = leads.filter(l => l.isReported).length;
  
  // Total groups involved in reported leads
  const totalGroupsInvolved = leads
    .filter(l => l.isReported)
    .reduce((acc, lead) => acc + lead.groupCount, 0);
  
  return {
    totalActiveLeads: leads.length,
    unreportedCount,
    reportedCount,
    totalGroupsInvolved
  };
};

// Data logic for Chart (Sunburst)
export const getChartData = (leads: LeadRecord[]) => {
  const reportedLeads = leads.filter(l => l.isReported);
  const unreportedCount = leads.filter(l => !l.isReported).length;

  const countByStatus = (status: string) => reportedLeads.filter(l => l.reportStatus === status).length;

  // Level 4 (生成视频 / 处理中)
  const videoGeneratedCount = countByStatus('已回传-音视频-已处理-正常分析-生成视频');
  const inProcessingCount = countByStatus('已回传-音视频-已处理-正常分析-处理中');
  
  // Level 3 (角色判定 / 正常进行 / 正常分析)
  const roleDeterminedCount = countByStatus('已回传-音视频-已处理-角色判定');
  const normalProgressCount = countByStatus('已回传-音视频-已处理-正常进行');
  const normalAnalysisCount = videoGeneratedCount + inProcessingCount;

  // Level 2 (无法处理 / 已处理)
  const audioVideoUnableCount = countByStatus('已回传-音视频-无法处理');
  const audioVideoProcessedCount = roleDeterminedCount + normalProgressCount + normalAnalysisCount;

  // Level 1 (已中标 / 截图 / 音视频)
  const wonCount = countByStatus('已回传-已中标');
  const screenshotCount = countByStatus('已回传-截图');
  const audioVideoCount = audioVideoUnableCount + audioVideoProcessedCount;

  // Level 0 (未回传 / 已回传)
  const notReturnedCount = countByStatus('未回传');
  const returnedCount = wonCount + screenshotCount + audioVideoCount;

  const data = [
    {
      name: '未报备',
      value: unreportedCount,
      itemStyle: { color: '#f59e0b' }
    },
    {
      name: '已报备',
      itemStyle: { color: '#3b82f6' },
      children: [
        {
          name: '未回传',
          value: notReturnedCount,
          itemStyle: { color: '#ef4444' }
        },
        {
          name: '已回传',
          itemStyle: { color: '#10b981' },
          children: [
            { name: '已中标', value: wonCount, itemStyle: { color: '#f59e0b' } },
            { name: '截图', value: screenshotCount, itemStyle: { color: '#6366f1' } },
            {
              name: '音视频',
              itemStyle: { color: '#8b5cf6' },
              children: [
                { name: '无法处理', value: audioVideoUnableCount, itemStyle: { color: '#94a3b8' } },
                {
                  name: '已处理',
                  itemStyle: { color: '#ec4899' },
                  children: [
                    { name: '角色判定', value: roleDeterminedCount, itemStyle: { color: '#f59e0b' } },
                    { name: '正常进行', value: normalProgressCount, itemStyle: { color: '#14b8a6' } },
                    {
                      name: '正常分析',
                      itemStyle: { color: '#06b6d4' },
                      children: [
                        { name: '生成视频', value: videoGeneratedCount, itemStyle: { color: '#10b981' } },
                        { name: '处理中', value: inProcessingCount, itemStyle: { color: '#3b82f6' } }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];
  return data;
};

// Data logic for Unreported Personnel Ranking list
export const getUnreportedRanking = (leads: LeadRecord[]) => {
  const counts = new Map<string, number>();
  leads.forEach(l => {
    if (!l.isReported) {
      counts.set(l.person, (counts.get(l.person) || 0) + 1);
    }
  });
  return Array.from(counts.entries())
    .map(([person, count]) => ({ person, count }))
    .sort((a, b) => b.count - a.count);
};

// Data logic for Reported Personnel Stats list
export const getReportedPersonnelStats = (leads: LeadRecord[]) => {
  const stats = new Map<string, any>();
  leads.forEach(l => {
    if (l.isReported) {
      const existing = stats.get(l.person) || { leadCount: 0, groupCount: 0, audioVideoCount: 0 };
      existing.leadCount += 1;
      existing.groupCount += l.groupCount;
      if (l.reportStatus && l.reportStatus.includes('音视频')) {
        existing.audioVideoCount += 1;
      }
      stats.set(l.person, existing);
    }
  });
  return Array.from(stats.entries())
    .map(([person, data]) => ({ person, ...data }))
    .sort((a, b) => b.leadCount - a.leadCount);
};

// Data logic for Fixed Member Groups list
export const getGroupStatsList = (personnel: PersonnelRecord[]) => {
  return personnel
    .map(p => ({
      name: p.name,
      isFixedMember: p.isFixedMember,
      involvedGroups: p.involvedGroups,
      speakingGroups: p.speakingGroups,
      totalMessages: p.totalMessages,
      speakingRatio: p.involvedGroups > 0 ? ((p.speakingGroups / p.involvedGroups) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.totalMessages - a.totalMessages);
};
