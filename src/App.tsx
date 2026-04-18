
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Spin, Tabs, Select, Input } from 'antd';
import type { TabsProps } from 'antd';
import { 
  getLeads, 
  getPersonnel, 
  getChartData, 
  getUnreportedRanking, 
  getReportedPersonnelStats, 
  getGroupStatsList 
} from './data/api';
import { LeadRecord, PersonnelRecord } from './types';
import EchartsSunburst from './components/EchartsSunburst';
import { UnreportedRankTable, ReportedStatsTable, GroupStatsTable } from './components/PersonnelTables';
import { LeadDetailsTable } from './components/LeadDetailsTable';

import { ClipboardCheck } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('All');

  // Filter States
  const [filterLeadId, setFilterLeadId] = useState<string>('');
  const [filterReported, setFilterReported] = useState<string>('All');
  const [filterReturned, setFilterReturned] = useState<string>('All');
  const [filterContent, setFilterContent] = useState<string>('All');
  const [filterProcessed, setFilterProcessed] = useState<string>('All');
  const [filterProcessStatus, setFilterProcessStatus] = useState<string>('All');
  const [filterVideo, setFilterVideo] = useState<string>('All');

  useEffect(() => {
    async function fetchData() {
      const [leadsData, attrData] = await Promise.all([getLeads(), getPersonnel()]);
      setLeads(leadsData);
      setPersonnel(attrData);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Compute globally filtered leads and make the entire dashboard reactive
  const filteredGlobalLeads = useMemo(() => {
    return leads.filter(lead => {
      if (filterLeadId && !lead.id.toLowerCase().includes(filterLeadId.toLowerCase())) return false;
      
      if (filterReported !== 'All') {
        const isRep = filterReported === 'Yes';
        if (lead.isReported !== isRep) return false;
      }

      if (filterReturned !== 'All') {
        const isRet = filterReturned === 'Yes';
        const leadIsRet = lead.reportStatus !== '未报备' && lead.reportStatus !== '未回传';
        if (isRet !== leadIsRet) return false;
      }

      if (filterContent !== 'All') {
        if (filterContent === '截图' && lead.reportStatus !== '已回传-截图') return false;
        if (filterContent === '音视频' && !lead.reportStatus.includes('音视频')) return false;
        if (filterContent === '中标' && lead.reportStatus !== '已回传-已中标') return false;
      }

      if (filterProcessed !== 'All') {
        const isProc = filterProcessed === 'Yes';
        if (isProc && !lead.reportStatus.includes('已处理')) return false;
        if (!isProc && lead.reportStatus !== '已回传-音视频-无法处理') return false;
      }

      if (filterProcessStatus !== 'All') {
        if (filterProcessStatus === '角色判定' && lead.reportStatus !== '已回传-音视频-已处理-角色判定') return false;
        if (filterProcessStatus === '正常进行' && lead.reportStatus !== '已回传-音视频-已处理-正常进行') return false;
        if (filterProcessStatus === '正常分析' && !lead.reportStatus.includes('正常分析')) return false;
      }

      if (filterVideo !== 'All') {
        const isVideo = filterVideo === 'Yes';
        if (isVideo && !lead.reportStatus.includes('生成视频')) return false;
        if (!isVideo && !lead.reportStatus.includes('处理中')) return false;
      }

      return true;
    });
  }, [leads, filterLeadId, filterReported, filterReturned, filterContent, filterProcessed, filterProcessStatus, filterVideo]);

  // Derived stats based on filtered leads dynamically
  const displayStats = useMemo(() => {
    const unreportedCount = filteredGlobalLeads.filter(l => !l.isReported).length;
    const reportedCount = filteredGlobalLeads.filter(l => l.isReported).length;
    const totalGroupsInvolved = filteredGlobalLeads
      .filter(l => l.isReported)
      .reduce((acc, lead) => acc + lead.groupCount, 0);
    return {
      totalActiveLeads: filteredGlobalLeads.length,
      unreportedCount,
      reportedCount,
      totalGroupsInvolved
    };
  }, [filteredGlobalLeads]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin size="large" tip="系统数据加载中..." />
      </div>
    );
  }

  // Derived data via API layer
  const chartData = getChartData(filteredGlobalLeads);
  const unreportedRankData = getUnreportedRanking(filteredGlobalLeads);
  const reportedStatsData = getReportedPersonnelStats(filteredGlobalLeads);
  const groupStatsData = getGroupStatsList(personnel);

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: '未报备线索人员排行',
      children: <UnreportedRankTable data={unreportedRankData} />,
    },
    {
      key: '2',
      label: '核心人员报备量透视',
      children: <ReportedStatsTable data={reportedStatsData} />,
    },
    {
      key: '3',
      label: '群沟通活动概况 (含固定成员)',
      children: <GroupStatsTable data={groupStatsData} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 font-sans pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-sm">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-[18px] font-bold text-slate-800 tracking-tight">
              线索报备数据枢纽
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">
        
        {/* Global Summary Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <TopStatCard 
            title="总活跃线索数" 
            value={displayStats.totalActiveLeads} 
            color="text-slate-800"
            subText="当前过滤阶段合计"
          />
          <TopStatCard 
            title="已报备线索数" 
            value={displayStats.reportedCount} 
            color="text-blue-600"
            subText={displayStats.totalActiveLeads > 0 ? `报备率: ${((displayStats.reportedCount / displayStats.totalActiveLeads) * 100).toFixed(0)}%` : '报备率: 0%'}
          />
          <TopStatCard 
            title="未报备线索数" 
            value={displayStats.unreportedCount} 
            color="text-amber-500"
            subText="请相关人员跟进"
          />
          <TopStatCard 
            title="累计涉及工作群" 
            value={displayStats.totalGroupsInvolved} 
            color="text-slate-800"
            subText="当前条件下的群组聚合"
          />
        </section>

        {/* Personnel Stats Row: 1 Row, 3 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="pb-2 mb-2 border-b border-slate-50">
               <h3 className="text-[13px] font-bold text-slate-800">未报备线索人员排行</h3>
             </div>
             <UnreportedRankTable data={unreportedRankData} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="pb-2 mb-2 border-b border-slate-50">
               <h3 className="text-[13px] font-bold text-slate-800">核心人员报备量透视</h3>
             </div>
             <ReportedStatsTable data={reportedStatsData} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="pb-2 mb-2 border-b border-slate-50">
               <h3 className="text-[13px] font-bold text-slate-800">群沟通活动概况</h3>
             </div>
             <GroupStatsTable data={groupStatsData} />
          </div>

        </div>

        {/* Sunburst Chart Row */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
           <div className="pb-2 border-b border-slate-100 mb-3">
             <h2 className="text-[14px] font-bold text-slate-800">全量数据结构旭日图 (ECharts)</h2>
             <p className="text-xs text-slate-500 mt-1">依赖于下方全局过滤条件，点击扇区进行深度下钻透视（联动展示下方详情与列表）</p>
           </div>
           {/* Wrap to ensure optimal full-width viewing without stretching too high */}
           <div className="w-full max-w-[800px] mx-auto">
             <EchartsSunburst 
                data={chartData} 
                onNodeSelect={(node) => setSelectedNode(node)} 
                selectedNode={selectedNode}
             />
           </div>
        </div>

        {/* Global Filters & Details Table Wrapped Together */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 mt-2">
           <div className="mb-4 pb-4 border-b border-slate-100">
               <h2 className="text-[14px] font-bold text-slate-800">底层数据详情追踪及全局过滤</h2>
               <p className="text-xs text-slate-500 mt-1 mb-4">通过下方复合条件过滤，将实时改变全盘仪表板及上方排行榜图表结构</p>
               
               {/* --- GLOBAL FILTERS --- */}
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner flex flex-wrap gap-x-4 gap-y-3">
                  <div className="flex-1 min-w-[120px] max-w-[200px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">线索编号 / 搜索</div>
                    <Input size="small" placeholder="输入编号快速检索" value={filterLeadId} onChange={e => setFilterLeadId(e.target.value)} allowClear />
                  </div>
                  <div className="flex-1 min-w-[90px] max-w-[140px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">是否报备</div>
                    <Select size="small" className="w-full" value={filterReported} onChange={setFilterReported} options={[{value:'All', label:'全部'}, {value:'Yes', label:'已报备'}, {value:'No', label:'未报备'}]} />
                  </div>
                  <div className="flex-1 min-w-[90px] max-w-[140px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">是否回传</div>
                    <Select size="small" className="w-full" value={filterReturned} onChange={setFilterReturned} options={[{value:'All', label:'全部'}, {value:'Yes', label:'已回传'}, {value:'No', label:'未回传'}]} />
                  </div>
                  <div className="flex-1 min-w-[100px] max-w-[140px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">回传内容</div>
                    <Select size="small" className="w-full" value={filterContent} onChange={setFilterContent} options={[{value:'All', label:'全部'}, {value:'音视频', label:'音视频'}, {value:'截图', label:'截图'}, {value:'中标', label:'已中标'}]} />
                  </div>
                  <div className="flex-1 min-w-[100px] max-w-[140px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">(音视频)是否处理</div>
                    <Select size="small" className="w-full" value={filterProcessed} onChange={setFilterProcessed} options={[{value:'All', label:'全部'}, {value:'Yes', label:'已处理'}, {value:'No', label:'无法处理'}]} />
                  </div>
                  <div className="flex-1 min-w-[100px] max-w-[140px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">处理状态</div>
                    <Select size="small" className="w-full" value={filterProcessStatus} onChange={setFilterProcessStatus} options={[{value:'All', label:'全部'}, {value:'角色判定', label:'角色判定'}, {value:'正常进行', label:'正常进行'}, {value:'正常分析', label:'正常分析'}]} />
                  </div>
                  <div className="flex-1 min-w-[100px] max-w-[140px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">是否生成视频</div>
                    <Select size="small" className="w-full" value={filterVideo} onChange={setFilterVideo} options={[{value:'All', label:'全部'}, {value:'Yes', label:'已生成'}, {value:'No', label:'处理中'}]} />
                  </div>
               </div>
           </div>

           {/* Passed through LeadDetailsTable, we render it directly without double card wrappers */}
           <LeadDetailsTable leads={filteredGlobalLeads} filterNode={selectedNode} isEmbedded={true} />
        </div>
        
      </main>
    </div>
  );
}

function TopStatCard({ title, value, color, subText }: { title: string; value: number; color: string; subText: string }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[100px] transition-transform hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-2">
         <div className="text-[12px] font-medium text-slate-500 uppercase">{title}</div>
      </div>
      <div>
         <div className={cn("text-2xl sm:text-3xl font-bold tracking-tight mb-0.5", color)}>{value}</div>
         <div className="text-[10px] text-slate-400">{subText}</div>
      </div>
    </div>
  );
}
