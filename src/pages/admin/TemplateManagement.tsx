import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface MsgTemplate {
  id: string;
  name: string;
  usage: string;
  content: string;
}

const mockTemplates: MsgTemplate[] = [
  { id: '1', name: '建群欢迎语', usage: '新建沟通群', content: '各位好，本群为【{leadName}】项目专属沟通群，后续交流将在此进行。' },
  { id: '2', name: '视频报告推送', usage: '视频推群', content: '【{leadName}】的最新数字人分析报告已生成，请点击链接查看：{videoUrl}' }
];

export default function TemplateManagement() {
  const [data, setData] = useState<MsgTemplate[]>(mockTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<MsgTemplate | null>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (record?: MsgTemplate) => {
    setEditingTpl(record || null);
    if (record) form.setFieldsValue(record);
    else form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    if (editingTpl) {
      setData(data.map(item => item.id === editingTpl.id ? { ...item, ...values } : item));
    } else {
      const newTpl = { ...values, id: `T${Math.floor(Math.random()*100)}` };
      setData([...data, newTpl]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData(data.filter(item => item.id !== id));
  };

  const columns: ColumnsType<MsgTemplate> = [
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
        <Space size="middle">
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

      <Table columns={columns} dataSource={data} rowKey="id" size="middle" />

      <Modal 
        title={editingTpl ? "编辑消息模板" : "新增消息模板"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="usage" label="使用场景" rules={[{ required: true }]}><Input placeholder="例如：新建沟通群" /></Form.Item>
          <Form.Item name="content" label="模板内容" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="请在这里编写模板正文..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
