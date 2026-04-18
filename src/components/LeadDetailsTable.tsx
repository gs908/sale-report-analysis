import React, { useState } from 'react';
import { Table, Input, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { LeadRecord } from '../types';

interface LeadDetailsTableProps {
  leads: LeadRecord[];
  filterNode: string; // The node clicked from the sunburst chart
  isEmbedded?: boolean; 
}

export const LeadDetailsTable: React.FC<LeadDetailsTableProps> = ({ leads, filterNode, isEmbedded }) => {
  // 1. Filter by ECharts node selection based on data hierarchy classification
  const nodeFiltered = leads.filter(lead => {
    if (filterNode === 'All' || filterNode === '总活跃线索') return true;
    
    // We map the node to our specific criteria
    if (filterNode === '已报备') return lead.isReported;
    if (filterNode === '未报备') return !lead.isReported;
    
    // Deeper report categories
    if (!lead.isReported) return false; // anything below relies on being reported
    
    if (filterNode === '未回传') return lead.reportStatus === '未回传';
    if (filterNode === '已回传') return lead.reportStatus.startsWith('已回传-');
    if (filterNode === '已中标') return lead.reportStatus === '已回传-已中标';
    if (filterNode === '截图') return lead.reportStatus === '已回传-截图';
    
    // audio/video block
    if (filterNode === '音视频') return lead.reportStatus.includes('音视频');
    if (filterNode === '无法处理') return lead.reportStatus === '已回传-音视频-无法处理';
    if (filterNode === '已处理') return lead.reportStatus.includes('已处理');
    if (filterNode === '角色判定') return lead.reportStatus === '已回传-音视频-已处理-角色判定';
    if (filterNode === '正常进行') return lead.reportStatus === '已回传-音视频-已处理-正常进行';
    if (filterNode === '正常分析') return lead.reportStatus.includes('正常分析');
    if (filterNode === '生成视频') return lead.reportStatus === '已回传-音视频-已处理-正常分析-生成视频';
    if (filterNode === '处理中') return lead.reportStatus === '已回传-音视频-已处理-正常分析-处理中';

    return true; // Fallback
  });

  const columns: ColumnsType<LeadRecord> = [
    {
      title: '线索编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
         <div>
            <div className="font-semibold text-slate-800">{text}</div>
            <div className="text-xs text-slate-500">{record.leadName}</div>
         </div>
      ),
      width: 250,
    },
    {
      title: '负责人',
      dataIndex: 'person',
      key: 'person',
      width: 100,
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        if (!record.isReported) {
          return <Tag color="warning">未报备</Tag>;
        }
        
        let color = 'blue';
        if (record.reportStatus === '未回传') color = 'error';
        else if (record.reportStatus.includes('生成视频') || record.reportStatus === '已回传-已中标') color = 'success';
        else if (record.reportStatus.includes('处理中')) color = 'processing';
        else if (record.reportStatus.includes('无法处理')) color = 'default';

        // Extract the last part of the string as the display badge
        const parts = record.reportStatus.split('-');
        const displayLabel = parts[parts.length - 1];

        return <Tag color={color}>{displayLabel}</Tag>;
      },
      width: 120,
    },
    {
      title: '群数量',
      dataIndex: 'groupCount',
      key: 'groupCount',
      width: 80,
    },
    {
      title: '备注信息',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => <span className="text-xs text-slate-500">{text || '--'}</span>
    }
  ];

  return (
    <div className={isEmbedded ? "mt-4" : "bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 mt-4"}>
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div>
             <h2 className="text-[14px] font-bold text-slate-800">底层数据详情追踪</h2>
             <p className="text-xs text-slate-500 mt-1">目前数据范围：通过上方层级图点击钻取过滤而来</p>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-slate-500">当前过滤节点:</span>
        <Tag color={filterNode === 'All' ? 'default' : 'blue'}>
           {filterNode === 'All' ? '全景展示 (无过滤)' : filterNode}
        </Tag>
        <span className="text-xs text-slate-500 ml-2">总计符合: <span className="font-bold text-slate-800">{nodeFiltered.length}</span> 条</span>
      </div>

      <Table 
        columns={columns} 
        dataSource={nodeFiltered} 
        rowKey="id"
        pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条`, showSizeChanger: true }}
        size="small"
        scroll={{ x: 700 }}
      />
    </div>
  );
};
