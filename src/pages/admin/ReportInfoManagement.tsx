import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ReportRecord {
  id: string;
  leadName: string;
  customerName: string;
  person: string;
  isReported: boolean;
  status: string;
}

const mockData: ReportRecord[] = [
  { id: 'L001', leadName: '资产转出业务改造', customerName: '北汽汽车金融', person: '张三', isReported: true, status: '已回传-音视频-已处理-正常分析-生成视频' },
  { id: 'L002', leadName: '云平台迁移', customerName: '建设银行', person: '卫六', isReported: false, status: '未报备' }
];

export default function ReportInfoManagement() {
  const [data, setData] = useState<ReportRecord[]>(mockData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReportRecord | null>(null);
  const [form] = Form.useForm();

  const handleOpenModal = (record?: ReportRecord) => {
    setEditingRecord(record || null);
    if (record) form.setFieldsValue(record);
    else {
      form.resetFields();
      form.setFieldsValue({ isReported: false, status: '未报备' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    if (editingRecord) {
      setData(data.map(item => item.id === editingRecord.id ? { ...item, ...values } : item));
    } else {
      const newRecord = { ...values, id: `L0${Math.floor(Math.random()*100)}` };
      setData([...data, newRecord]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData(data.filter(item => item.id !== id));
  };

  const columns: ColumnsType<ReportRecord> = [
    { title: '线索编号', dataIndex: 'id', key: 'id' },
    { title: '线索名称', dataIndex: 'leadName', key: 'leadName' },
    { title: '客户名称', dataIndex: 'customerName', key: 'customerName' },
    { title: '负责人', dataIndex: 'person', key: 'person' },
    { 
      title: '报备情况', 
      dataIndex: 'isReported', 
      key: 'isReported',
      render: (val) => val ? <Tag color="blue">已报备</Tag> : <Tag color="default">未报备</Tag>
    },
    { title: '当前状态', dataIndex: 'status', key: 'status' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => handleOpenModal(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">报备信息管理</h3>
        <Button type="primary" onClick={() => handleOpenModal()}>新增报备</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" size="middle" />

      <Modal 
        title={editingRecord ? "编辑报备信息" : "新增报备"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="leadName" label="线索名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="person" label="负责人" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="isReported" label="是否报备" rules={[{ required: true }]}>
            <Select options={[{ value: true, label: '已报备' }, { value: false, label: '未报备' }]} />
          </Form.Item>
          <Form.Item name="status" label="当前状态"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
