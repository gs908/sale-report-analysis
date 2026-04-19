import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tag, Popconfirm, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FixedMember, PageResult } from '../../api/admin';
import { getFixedMembers, createFixedMember, updateFixedMember, deleteFixedMember } from '../../api/admin';

export default function FixedMemberManagement() {
  const [data, setData] = useState<FixedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FixedMember | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = (current = 1, size = 10) => {
    setLoading(true);
    getFixedMembers({ current, size }).then((res: PageResult<FixedMember>) => {
      setData(res.list || []);
      setPagination({ current: res.current, pageSize: res.size, total: res.total });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (record?: FixedMember) => {
    setEditingMember(record || null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingMember) form.setFieldsValue(editingMember);
      else form.resetFields();
    }
  }, [isModalOpen, editingMember]);

  const handleSave = async (values: any) => {
    if (editingMember) {
      await updateFixedMember(editingMember.id, values);
      setData((data || []).map(item => item.id === editingMember.id ? { ...item, ...values } : item));
    } else {
      await createFixedMember(values);
      fetchData(pagination.current, pagination.pageSize);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteFixedMember(id);
    fetchData(pagination.current, pagination.pageSize);
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
        <Space size="small">
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
      
      <Spin spinning={loading}>
      <Table
        columns={columns}
        dataSource={data || []}
        rowKey="id"
        size="middle"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          onChange: (page, pageSize) => fetchData(page, pageSize)
        }}
      />
      </Spin>

      <Modal 
        title={editingMember ? "编辑固定成员" : "新增固定成员"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
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
