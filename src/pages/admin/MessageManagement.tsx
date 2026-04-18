import React, { useState } from 'react';
import { Table, Input, Button, Modal, List, Avatar, Space } from 'antd';
import { SearchOutlined, MessageOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface MsgGroup {
  id: string;
  name: string;
  leadName: string;
  msgCount: number;
  lastActive: string;
}

const mockGroups: MsgGroup[] = [
  { id: '1', name: '北京银行建设沟通交流群', leadName: '资产转出业务改造', msgCount: 156, lastActive: '2026-04-18 10:30' },
  { id: '2', name: '交行信贷重构沟通群', leadName: '信贷系统重构', msgCount: 342, lastActive: '2026-04-17 15:20' }
];

export default function MessageManagement() {
  const [data, setData] = useState<MsgGroup[]>(mockGroups);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<MsgGroup | null>(null);

  const handleSearch = () => {
    // simplified blur search
    const lowered = searchTerm.toLowerCase();
    const filtered = mockGroups.filter(g => 
      g.name.toLowerCase().includes(lowered) || 
      g.leadName.toLowerCase().includes(lowered)
    );
    setData(filtered);
  };

  const openMessages = (group: MsgGroup) => {
    setActiveGroup(group);
    setIsModalOpen(true);
  };

  const columns: ColumnsType<MsgGroup> = [
    { title: '群名称', dataIndex: 'name', key: 'name', render: (t) => <span className="font-bold text-slate-700">{t}</span> },
    { title: '关联线索', dataIndex: 'leadName', key: 'leadName' },
    { title: '消息总量', dataIndex: 'msgCount', key: 'msgCount' },
    { title: '最后活跃', dataIndex: 'lastActive', key: 'lastActive' },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => openMessages(record)}>查看消息</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-lg font-bold text-slate-800">群消息管理</h3>
        <Space>
          <Input 
             placeholder="搜索线索名称、群名称、人员" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             onPressEnter={handleSearch}
             prefix={<SearchOutlined className="text-slate-400" />}
             style={{ width: 300 }}
          />
          <Button onClick={handleSearch}>查询</Button>
        </Space>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        size="middle" 
        pagination={{ 
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          defaultPageSize: 10 
        }} 
      />

      <Modal
        title={`${activeGroup?.name} - 聊天记录`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        bodyStyle={{ height: 400, overflowY: 'auto', backgroundColor: '#f8fafc', padding: '20px' }}
      >
        <List
          itemLayout="horizontal"
          dataSource={[
            { author: '张三', text: '大家好，项目准备启动', time: '10:00 AM' },
            { author: '客户代表', text: '什么时候可以出方案？', time: '10:05 AM' },
            { author: '楚五', text: '预计本周五给到初稿。', time: '10:10 AM' }
          ]}
          renderItem={(item) => (
            <div className={`flex gap-3 mb-4 ${item.author === '客户代表' ? 'flex-row' : 'flex-row-reverse'}`}>
              <Avatar className={item.author === '客户代表' ? "bg-blue-500" : "bg-emerald-500"}>
                {item.author[0]}
              </Avatar>
              <div className={`max-w-[70%] rounded-lg p-3 ${item.author === '客户代表' ? 'bg-white border border-slate-200' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="flex justify-between items-center mb-1 gap-4">
                  <span className="text-xs font-bold text-slate-600">{item.author}</span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
                <div className="text-sm text-slate-800">{item.text}</div>
              </div>
            </div>
          )}
        />
      </Modal>
    </div>
  );
}
