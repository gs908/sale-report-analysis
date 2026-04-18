import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface UnreportedRankProps {
  data: any[];
}
export const UnreportedRankTable: React.FC<UnreportedRankProps> = ({ data }) => {
  const columns: ColumnsType<any> = [
    {
      title: '排名',
      key: 'rank',
      render: (text, record, index) => <span className="text-slate-400 font-mono font-medium">{index + 1}</span>,
      width: 50,
      align: 'center',
    },
    {
      title: '人员名称',
      dataIndex: 'person',
      key: 'person',
      render: (text) => <span className="font-semibold text-slate-800">{text}</span>
    },
    {
      title: '线索数',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (count) => <span className="text-rose-500 font-bold text-base">{count}</span>,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
    }
  ];

  return <Table columns={columns} dataSource={data} rowKey="person" pagination={{ pageSize: 20, position: ['bottomCenter'], showSizeChanger: false }} size="small" className="w-full" />;
}

interface ReportedStatsProps {
  data: any[];
}
export const ReportedStatsTable: React.FC<ReportedStatsProps> = ({ data }) => {
  const columns: ColumnsType<any> = [
    {
      title: '人员',
      dataIndex: 'person',
      key: 'person',
      render: (text) => <span className="font-semibold text-slate-800">{text}</span>
    },
    {
      title: '报备数量',
      dataIndex: 'leadCount',
      key: 'leadCount',
      align: 'center',
      render: (val) => <span className="text-sky-500 font-bold text-base">{val}</span>,
      sorter: (a, b) => a.leadCount - b.leadCount,
      defaultSortOrder: 'descend',
    },
    {
      title: <div className="leading-snug">回传次数<br/><span className="text-[11px] font-normal text-slate-400">(音视频 / 截图)</span></div>,
      key: 'mediaCount',
      align: 'center',
      render: (_, record) => {
        const avCount = record.audioVideoCount || 0;
        const ssCount = record.screenshotCount || 0;
        
        // 当有报备数据，但完全没有任何回传时的空缺高亮：红色系
        if (avCount === 0 && ssCount === 0 && record.leadCount > 0) {
          return (
            <div className="flex items-center justify-center">
              <span className="text-[12px] font-medium text-rose-500 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded leading-none">
                未回传
              </span>
            </div>
          );
        }

        return (
          <div className="font-bold text-base tracking-wide flex items-center justify-center gap-1.5">
            <span className={avCount > 0 ? "text-emerald-500" : "text-slate-300 font-normal"}>{avCount > 0 ? avCount : '-'}</span>
            <span className="text-slate-200 font-normal text-sm">/</span>
            <span className={ssCount > 0 ? "text-orange-500" : "text-slate-300 font-normal"}>{ssCount > 0 ? ssCount : '-'}</span>
          </div>
        );
      }
    }
  ];

  return <Table columns={columns} dataSource={data} rowKey="person" pagination={{ pageSize: 20, position: ['bottomCenter'], showSizeChanger: false }} size="small" className="w-full" />;
}

interface GroupStatsProps {
  data: any[];
}
export const GroupStatsTable: React.FC<GroupStatsProps> = ({ data }) => {
  const columns: ColumnsType<any> = [
    {
      title: '人员',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span className={`font-semibold px-2 py-0.5 rounded ${record.isFixedMember ? 'bg-amber-100/80 text-amber-900 border border-amber-200/50' : 'text-slate-800'}`}>
          {text}
        </span>
      )
    },
    {
      title: '总消息数',
      dataIndex: 'totalMessages',
      key: 'totalMessages',
      align: 'center',
      sorter: (a, b) => a.totalMessages - b.totalMessages,
      defaultSortOrder: 'descend',
      render: (val) => <span className="font-bold text-slate-800">{val}</span>
    },
    {
      title: '所在群数',
      dataIndex: 'involvedGroups',
      key: 'involvedGroups',
      align: 'center',
    },
    {
      title: '发言群数',
      dataIndex: 'speakingGroups',
      key: 'speakingGroups',
      align: 'center',
    },
    {
      title: '群发言占比',
      dataIndex: 'speakingRatio',
      key: 'speakingRatio',
      align: 'center',
      render: (val) => <span className="text-emerald-600 font-medium">{val}%</span>
    }
  ];

  return <Table columns={columns} dataSource={data} rowKey="name" pagination={{ pageSize: 20, position: ['bottomCenter'], showSizeChanger: false }} size="small" className="w-full" />;
}
