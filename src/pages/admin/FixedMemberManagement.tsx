import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tag, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface FixedMember {
  id: string;
  name: string;
  department: string;
  role: string;
}

const mockFixedMembers: FixedMember[] = [
  { id: '1', name: '楚五', department: '管理', role: '项目总监' },
  { id: '2', name: '卫六', department: '市场', role: '区域经理' },
  { id: '3', name: '蒋七', department: '技术', role: '架构师' }
];

export default function FixedMemberManagement() {
  const [data, setData] = useState<FixedMember[]>(mockFixedMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FixedMember | null>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (record?: FixedMember) => {
    setEditingMember(record || null);
    if (record) form.setFieldsValue(record);
    else form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    if (editingMember) {
      setData(data.map(item => item.id === editingMember.id ? { ...item, ...values } : item));
    } else {
      const newMember = { ...values, id: `F${Math.floor(Math.random()*1000)}` };
      setData([...data, newMember]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData(data.filter(item => item.id !== id));
  };

  const columns: ColumnsType<FixedMember> = [
    { title: '人员姓名', dataIndex: 'name', key: 'name', render: (t) => <span className="font-bold">{t}</span> },
    { 
      title: '所属序列', 
      dataIndex: 'department', 
      key: 'department',
      render: (d) => <Tag color="blue">{d}</Tag>
    },
    { title: '岗位类型', dataIndex: 'role', key: 'role' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => handleOpenModal(record)}>编辑</Button>
          <Popconfirm title="确定移除此固定成员？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">移除</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-bold text-slate-800">建群固定成员配置</h3>
           <p className="text-xs text-slate-500 mt-1">此列表中的人员将在系统创建新群时，被自动拉入群聊成为默认群成员。</p>
        </div>
        <Button type="primary" onClick={() => handleOpenModal()}>新增固定成员</Button>
      </div>
      
      <Table columns={columns} dataSource={data} rowKey="id" size="middle" />

      <Modal 
        title={editingMember ? "编辑固定成员" : "新增固定成员"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label="所属序列" rules={[{ required: true }]}><Input placeholder="如：市场、管理、工程、BA" /></Form.Item>
          <Form.Item name="role" label="岗位类型"><Input placeholder="如：系统架构师" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
