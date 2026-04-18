
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Spin, Tabs, Select, Input, DatePicker, Button } from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
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
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
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

  // Date Range state
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs('2026-04-08'), dayjs('2026-04-22')]);

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
      if (filterLeadId) {
        const searchLower = filterLeadId.toLowerCase();
        if (!(
          lead.id.toLowerCase().includes(searchLower) ||
          lead.person.toLowerCase().includes(searchLower) ||
          lead.customerName.toLowerCase().includes(searchLower) ||
          (lead.leadName || '').toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }
      
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
    
    // Add logic for new metrics
    const communicationReportCount = filteredGlobalLeads.filter(l => l.reportStatus?.startsWith('已回传')).length;
    const audioVideoCount = filteredGlobalLeads.filter(l => l.reportStatus?.includes('音视频')).length;
    const videoGeneratedCount = filteredGlobalLeads.filter(l => l.reportStatus?.includes('生成视频')).length;

    const totalGroupsInvolved = filteredGlobalLeads
      .filter(l => l.isReported)
      .reduce((acc, lead) => acc + lead.groupCount, 0);
    return {
      totalActiveLeads: filteredGlobalLeads.length,
      unreportedCount,
      reportedCount,
      communicationReportCount,
      audioVideoCount,
      videoGeneratedCount,
      totalGroupsInvolved
    };
  }, [filteredGlobalLeads]);


  // Calculate Current Path for Breadcrumb
  const nodePathMap: Record<string, string[]> = {
    'All': ['全量数据'],
    '未报备': ['全量数据', '未报备'],
    '已报备': ['全量数据', '已报备'],
    '未回传': ['全量数据', '已报备', '未回传'],
    '已回传': ['全量数据', '已报备', '已回传'],
    '已中标': ['全量数据', '已报备', '已回传', '已中标'],
    '截图': ['全量数据', '已报备', '已回传', '截图'],
    '音视频': ['全量数据', '已报备', '已回传', '音视频'],
    '无法处理': ['全量数据', '已报备', '已回传', '音视频', '无法处理'],
    '已处理': ['全量数据', '已报备', '已回传', '音视频', '已处理'],
    '角色判定': ['全量数据', '已报备', '已回传', '音视频', '已处理', '角色判定'],
    '正常进行': ['全量数据', '已报备', '已回传', '音视频', '已处理', '正常进行'],
    '正常分析': ['全量数据', '已报备', '已回传', '音视频', '已处理', '正常分析'],
    '生成视频': ['全量数据', '已报备', '已回传', '音视频', '已处理', '正常分析', '生成视频'],
    '处理中': ['全量数据', '已报备', '已回传', '音视频', '已处理', '正常分析', '处理中'],
  };
  const currentPath = nodePathMap[selectedNode] || ['全量数据'];

  // Sync Sunburst Node clicks with Global Filters
  const handleNodeSelect = (node: string) => {
    setSelectedNode(node);

    // Reset fields selectively, then apply new state based on drill-down logic
    let rpt = 'All', ret = 'All', cont = 'All', proc = 'All', status = 'All', vid = 'All';

    if (node === '未报备') { rpt = 'No'; }
    if (['已报备', '未回传', '已回传', '已中标', '截图', '音视频', '无法处理', '已处理', '角色判定', '正常进行', '正常分析', '生成视频', '处理中'].includes(node)) { rpt = 'Yes'; }

    if (node === '未回传') { ret = 'No'; }
    if (['已回传', '已中标', '截图', '音视频', '无法处理', '已处理', '角色判定', '正常进行', '正常分析', '生成视频', '处理中'].includes(node)) { ret = 'Yes'; }

    if (node === '已中标') { cont = '中标'; }
    if (node === '截图') { cont = '截图'; }
    if (['音视频', '无法处理', '已处理', '角色判定', '正常进行', '正常分析', '生成视频', '处理中'].includes(node)) { cont = '音视频'; }

    if (node === '无法处理') { proc = 'No'; }
    if (['已处理', '角色判定', '正常进行', '正常分析', '生成视频', '处理中'].includes(node)) { proc = 'Yes'; }

    if (node === '角色判定') { status = '角色判定'; }
    if (node === '正常进行') { status = '正常进行'; }
    if (['正常分析', '生成视频', '处理中'].includes(node)) { status = '正常分析'; }

    if (node === '生成视频') { vid = 'Yes'; }
    if (node === '处理中') { vid = 'No'; }

    setFilterReported(rpt);
    setFilterReturned(ret);
    setFilterContent(cont);
    setFilterProcessed(proc);
    setFilterProcessStatus(status);
    setFilterVideo(vid);
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate re-fetching the data
    const [leadsData, attrData] = await Promise.all([getLeads(), getPersonnel()]);
    setLeads(leadsData);
    setPersonnel(attrData);
    // Optional delay to make standard fetch feel like a real refresh action
    setTimeout(() => {
      setLoading(false);
    }, 500); 
  };

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
              线索报备情况一览
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-slate-500">数据范围：</span>
            <DatePicker.RangePicker 
              value={dateRange as any} 
              onChange={(dates) => setDateRange(dates as any)}
              format="M月D日"
              allowClear={false}
              bordered={false}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[13px]"
            />
            <Button 
               type="primary" 
               icon={<SyncOutlined />} 
               onClick={handleRefresh}
               className="ml-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
               size="small"
            >
              刷新
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">
        
        {/* Global Summary Stats */}
        <section className="flex flex-col gap-3 lg:gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
            <TopStatCard 
              title="活跃线索总数" 
              value={displayStats.totalActiveLeads} 
              color="text-slate-800"
            />
            <TopStatCard 
              title="已报备线索数" 
              value={displayStats.reportedCount} 
              color="text-blue-600"
            />
            <TopStatCard 
              title="未报备线索数" 
              value={displayStats.unreportedCount} 
              color="text-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            <TopStatCard 
              title="交流报备总数" 
              value={displayStats.communicationReportCount} 
              color="text-cyan-600"
            />
            <TopStatCard 
              title="音视频回传总数" 
              value={displayStats.audioVideoCount} 
              color="text-indigo-600"
            />
            <TopStatCard 
              title="视频生成数" 
              value={displayStats.videoGeneratedCount} 
              color="text-emerald-600"
            />
            <TopStatCard 
              title="涉及的群数" 
              value={displayStats.totalGroupsInvolved} 
              color="text-slate-700"
            />
          </div>
        </section>

        {/* Personnel Stats Row: Flex Row for precision width control */}
        <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-6 items-start">
          
          <div className="w-full min-[300px]:w-[calc(50%-0.5rem)] lg:w-[25%] min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="pb-2 mb-2 border-b border-slate-50">
               <h3 className="text-[13px] font-bold text-slate-800">未报备线索人员排行</h3>
             </div>
             <UnreportedRankTable data={unreportedRankData} />
          </div>

          <div className="w-full min-[300px]:w-[calc(50%-0.5rem)] lg:w-[32%] min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="pb-2 mb-2 border-b border-slate-50">
               <h3 className="text-[13px] font-bold text-slate-800">报备数量排行</h3>
             </div>
             <ReportedStatsTable data={reportedStatsData} />
          </div>

          <div className="w-full lg:flex-1 lg:min-w-[40%] min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="pb-2 mb-2 border-b border-slate-50">
               <h3 className="text-[13px] font-bold text-slate-800 flex items-baseline gap-2">
                 群消息一览
                 <span className="text-[11px] font-normal text-slate-400">带底色的为固定加群人员</span>
               </h3>
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
           <div className="w-full max-w-[1200px] mx-auto">
             <EchartsSunburst 
                data={chartData} 
                onNodeSelect={handleNodeSelect} 
                selectedNode={selectedNode}
                currentPath={currentPath}
             />
           </div>
        </div>

        {/* Global Filters & Details Table Wrapped Together */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 mt-2">
           <div className="mb-4 pb-4 border-b border-slate-100">
               <h2 className="text-[14px] font-bold text-slate-800">售前交流报告生成情况一览</h2>
               <p className="text-xs text-slate-500 mt-1 mb-4">通过下方复合条件过滤，将实时改变全盘仪表板及上方排行榜图表结构</p>
               
               {/* --- GLOBAL FILTERS --- */}
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner flex flex-wrap gap-x-4 gap-y-3">
                  <div className="flex-1 min-w-[150px] max-w-[250px]">
                    <div className="text-[11px] text-slate-600 mb-1 font-semibold">综合文本检索</div>
                    <Input size="small" placeholder="输入编号/人员/客户等" value={filterLeadId} onChange={e => setFilterLeadId(e.target.value)} allowClear prefix={<SearchOutlined className="text-slate-400" />} />
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

function TopStatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="relative group bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 overflow-hidden flex flex-col justify-center items-center min-h-[100px]">
      {/* Decorative tech background element */}
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full opacity-50 inset-0 pointer-events-none group-hover:scale-150 transition-transform duration-500 ease-out" />
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 w-full">
        <div className="text-[13px] font-bold text-slate-500 text-center">{title}</div>
        <div className={cn("text-3xl sm:text-4xl font-black font-mono tracking-tight text-center", color)}>{value}</div>
      </div>
      {/* Bottom subtle accent line representing data stream */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[30%] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
