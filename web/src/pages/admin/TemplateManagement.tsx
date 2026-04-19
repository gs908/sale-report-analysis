import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Popconfirm, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MsgTemplate, PageResult } from '../../api/admin';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../api/admin';

const { TextArea } = Input;

export default function TemplateManagement() {
  const [data, setData] = useState<MsgTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<MsgTemplate | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = (current = 1, size = 10) => {
    setLoading(true);
    getTemplates({ current, size }).then((res: PageResult<MsgTemplate>) => {
      setData(res.list || []);
      setPagination({ current: res.current, pageSize: res.size, total: res.total });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (record?: MsgTemplate) => {
    setEditingTpl(record || null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingTpl) form.setFieldsValue(editingTpl);
      else form.resetFields();
    }
  }, [isModalOpen, editingTpl]);

  const handleSave = async (values: any) => {
    if (editingTpl) {
      await updateTemplate(editingTpl.id, values);
      setData((data || []).map(item => item.id === editingTpl.id ? { ...item, ...values } : item));
    } else {
      await createTemplate(values);
      fetchData(pagination.current, pagination.pageSize);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    fetchData(pagination.current, pagination.pageSize);
  };

  const columns: ColumnsType<MsgTemplate> = [
    { title: '模板编码', dataIndex: 'templateCode', key: 'templateCode', width: 120 },
    { title: '模板名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '使用场景', dataIndex: 'usage', key: 'usage', width: 150 },
    { 
      title: '模板内容', 
      dataIndex: 'content', 
      key: 'content',
      render: (text) => <div className="text-slate-600 bg-slate-50 p-2 border border-slate-200 rounded text-xs">{text}</div>
    },
    { 
      title: '操作', 
      key: 'action', 
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleOpenModal(record)}>编辑</Button>
          <Popconfirm title="确定删除该模板？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-bold text-slate-800">消息模板管理</h3>
           <p className="text-xs text-slate-500 mt-1">支持通过变量占位符如 `&#123;leadName&#125;`、`&#123;videoUrl&#125;` 进行动态消息组装。</p>
        </div>
        <Button type="primary" onClick={() => handleOpenModal()}>新增模板</Button>
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
        title={editingTpl ? "编辑消息模板" : "新增消息模板"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="templateCode" label="模板编码" rules={[{ required: true, pattern: /^[A-Za-z].*$/, message: '模板编码必须以英文字符开头' }]}><Input /></Form.Item>
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="usage" label="使用场景"><Input placeholder="例如：新建沟通群" /></Form.Item>
          <Form.Item name="content" label="模板内容" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="请在这里编写模板正文..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
