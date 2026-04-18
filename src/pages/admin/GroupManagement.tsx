import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Drawer, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface GroupRecord {
  id: string;
  archiveId: string;
  name: string;
  leadId: string;
  leadName: string;
  status: '正常' | '已解散';
  createdAt: string;
  dissolvedAt?: string;
  members: MemberRecord[];
}

interface MemberRecord {
  id: string;
  name: string;
  isFixed: boolean;
  department: string;
}

const mockGroups: GroupRecord[] = [
  {
    id: 'G1001',
    archiveId: 'A001',
    name: '北京银行建设沟通交流群',
    leadId: 'L001',
    leadName: '资产转出业务改造',
    status: '正常',
    createdAt: '2026-04-10 10:00:00',
    members: [
      { id: 'M01', name: '楚五', isFixed: true, department: '管理' },
      { id: 'M02', name: '卫六', isFixed: true, department: '市场' },
      { id: 'M03', name: '张三', isFixed: false, department: '工程' }
    ]
  }
];

export default function GroupManagement() {
  const [data, setData] = useState<GroupRecord[]>(mockGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  
  // Drawer state for Member Management
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<GroupRecord | null>(null);
  const [form] = Form.useForm();
  
  const handleOpenModal = (record?: GroupRecord) => {
    setEditingGroup(record || null);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ status: '正常' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    if (editingGroup) {
      setData(data.map(item => item.id === editingGroup.id ? { ...item, ...values } : item));
    } else {
      const newGroup: GroupRecord = {
        ...values,
        id: `G${Math.floor(Math.random() * 10000)}`,
        createdAt: new Date().toISOString().split('T')[0] + ' 10:00:00',
        members: [
          // Simulate auto-adding fixed members
          { id: `M_${Math.random()}`, name: '楚五', isFixed: true, department: '管理' },
          { id: `M_${Math.random()}`, name: '卫六', isFixed: true, department: '市场' },
        ]
      };
      setData([...data, newGroup]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData(data.filter(item => item.id !== id));
  };

  const openMemberManagement = (record: GroupRecord) => {
    setCurrentGroup(record);
    setMemberDrawerOpen(true);
  };

  const columns: ColumnsType<GroupRecord> = [
    { title: '群ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '会话存档ID', dataIndex: 'archiveId', key: 'archiveId', width: 100 },
    { title: '群名称', dataIndex: 'name', key: 'name' },
    { title: '线索编号', dataIndex: 'leadId', key: 'leadId', width: 100 },
    { title: '线索名称', dataIndex: 'leadName', key: 'leadName' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 90,
      render: (status) => <Tag color={status === '正常' ? 'success' : 'default'}>{status}</Tag>
    },
    { title: '建群时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
    { 
      title: '操作', 
      key: 'action', 
      width: 250,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => openMemberManagement(record)}>成员管理 ({record.members.length})</Button>
          <Button type="link" size="small" onClick={() => handleOpenModal(record)}>编辑</Button>
          <Popconfirm title="确定删除该群？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  // Members Drawer Columns
  const memberColumns: ColumnsType<MemberRecord> = [
    { title: '姓名', dataIndex: 'name', key: 'name', className: 'font-bold' },
    { 
      title: '属性', 
      key: 'isFixed', 
      render: (_, r) => r.isFixed ? <Tag color="orange">固定成员</Tag> : <Tag color="default">普通成员</Tag>
    },
    { 
      title: '序列', 
      dataIndex: 'department', 
      key: 'department',
      render: (dept) => {
        let color = 'blue';
        if (dept === '市场') color = 'cyan';
        if (dept === '管理') color = 'purple';
        if (dept === '工程') color = 'geekblue';
        if (dept === 'BA') color = 'magenta';
        return <Tag color={color}>{dept}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, __, index) => (
        <Popconfirm title="确定移除此成员？" onConfirm={() => {
           if (currentGroup) {
             const newMembers = [...currentGroup.members];
             newMembers.splice(index, 1);
             const updatedGroup = { ...currentGroup, members: newMembers };
             setCurrentGroup(updatedGroup);
             setData(data.map(g => g.id === updatedGroup.id ? updatedGroup : g));
           }
        }}>
           <Button type="link" danger size="small">移除</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">群及群成员管理</h3>
        <Button type="primary" onClick={() => handleOpenModal()}>新建群</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle" />

      {/* Add/Edit Modal */}
      <Modal 
        title={editingGroup ? "编辑群信息" : "新建群"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="群名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="archiveId" label="会话存档ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="leadId" label="线索编号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="leadName" label="线索名称"><Input /></Form.Item>
          <Form.Item name="status" label="群状态" rules={[{ required: true }]}>
            <Select options={[{ value: '正常', label: '正常' }, { value: '已解散', label: '已解散' }]} />
          </Form.Item>
          {editingGroup && <Form.Item name="dissolvedAt" label="解散时间"><Input placeholder="YYYY-MM-DD HH:mm:ss" /></Form.Item>}
        </Form>
      </Modal>

      {/* Member Management Drawer */}
      <Drawer
        title={`成员管理 - ${currentGroup?.name || ''}`}
        placement="right"
        width={500}
        onClose={() => setMemberDrawerOpen(false)}
        open={memberDrawerOpen}
      >
        <div className="mb-4">
           <Button type="dashed" block onClick={() => {
              const newMember: MemberRecord = { id: `M_${Math.random()}`, name: '新建人员', isFixed: false, department: '市场' };
              if(currentGroup) {
                 const updated = {...currentGroup, members: [...currentGroup.members, newMember]};
                 setCurrentGroup(updated);
                 setData(data.map(g => g.id === updated.id ? updated : g));
              }
           }}>
             + 添加临时群成员
           </Button>
        </div>
        <Table columns={memberColumns as any} dataSource={currentGroup?.members || []} rowKey="id" pagination={false} size="small" />
      </Drawer>
    </div>
  );
}
