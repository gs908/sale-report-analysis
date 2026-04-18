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
      width: 80,
      align: 'center',
    },
    {
      title: '人员名称',
      dataIndex: 'person',
      key: 'person',
      render: (text) => <span className="font-semibold text-slate-800">{text}</span>
    },
    {
      title: '活跃未报备线索数',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <span className="text-amber-600 font-bold text-base">{count}</span>,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
    }
  ];

  return <Table columns={columns} dataSource={data} rowKey="person" pagination={{ pageSize: 5 }} size="middle" className="w-full" scroll={{ x: 400 }} />;
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
      title: '已报备线索数',
      dataIndex: 'leadCount',
      key: 'leadCount',
      sorter: (a, b) => a.leadCount - b.leadCount,
      defaultSortOrder: 'descend',
    },
    {
      title: '音视频回传数',
      dataIndex: 'audioVideoCount',
      key: 'audioVideoCount',
    },
    {
      title: '所在群数量合计',
      dataIndex: 'groupCount',
      key: 'groupCount',
    }
  ];

  return <Table columns={columns} dataSource={data} rowKey="person" pagination={{ pageSize: 5 }} size="middle" scroll={{ x: 500 }} />;
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
        <div className="flex items-center gap-2">
           <span className="font-semibold">{text}</span>
           {record.isFixedMember && <Tag color="blue">固定成员</Tag>}
        </div>
      )
    },
    {
      title: '总消息数',
      dataIndex: 'totalMessages',
      key: 'totalMessages',
      sorter: (a, b) => a.totalMessages - b.totalMessages,
      defaultSortOrder: 'descend',
      render: (val) => <span className="font-bold text-slate-800">{val}</span>
    },
    {
      title: '所在群数',
      dataIndex: 'involvedGroups',
      key: 'involvedGroups',
    },
    {
      title: '发言群数',
      dataIndex: 'speakingGroups',
      key: 'speakingGroups',
    },
    {
      title: '群内活跃渗透率',
      dataIndex: 'speakingRatio',
      key: 'speakingRatio',
      render: (val) => <span className="text-emerald-600 font-medium">{val}%</span>
    }
  ];

  return <Table columns={columns} dataSource={data} rowKey="name" pagination={{ pageSize: 5 }} size="middle" scroll={{ x: 600 }} />;
}
