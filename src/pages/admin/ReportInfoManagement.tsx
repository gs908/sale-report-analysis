import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ReportRecord {
  id: string;
  leadName: string;
  customerName: string;
  person: string;
  isReported: boolean;
  isReturned: boolean; // 回传情况
  processingStatus: string; // 处理情况
  isVideoGenerated: boolean; // 是否生成视频
  isGroupCreated: boolean; // 是否建群
  remark: string; // 备注
}

const mockData: ReportRecord[] = [
  { id: 'L001', leadName: '资产转出业务改造', customerName: '北汽汽车金融', person: '张三', isReported: true, isReturned: true, processingStatus: '已处理', isVideoGenerated: true, isGroupCreated: true, remark: '无' },
  { id: 'L002', leadName: '云平台迁移', customerName: '建设银行', person: '卫六', isReported: false, isReturned: false, processingStatus: '未处理', isVideoGenerated: false, isGroupCreated: false, remark: '待跟进' }
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
    { title: '线索编号', dataIndex: 'id', key: 'id', width: 100, fixed: 'left' },
    { title: '线索名称', dataIndex: 'leadName', key: 'leadName', width: 150 },
    { title: '客户名称', dataIndex: 'customerName', key: 'customerName', width: 150 },
    { title: '负责人', dataIndex: 'person', key: 'person', width: 100 },
    { 
      title: '是否报备', 
      dataIndex: 'isReported', 
      key: 'isReported',
      width: 100,
      render: (val) => val ? <Tag color="blue">已报备</Tag> : <Tag color="default">未报备</Tag>
    },
    { title: '回传情况', dataIndex: 'isReturned', key: 'isReturned', width: 100, render: (v) => v ? '已回传' : '未回传' },
    { title: '处理情况', dataIndex: 'processingStatus', key: 'processingStatus', width: 100 },
    { title: '是否生成视频', dataIndex: 'isVideoGenerated', key: 'isVideoGenerated', width: 120, render: (v) => v ? '是' : '否' },
    { title: '是否建群', dataIndex: 'isGroupCreated', key: 'isGroupCreated', width: 100, render: (v) => v ? '是' : '否' },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 150 },
    { 
      title: '操作', 
      key: 'action', 
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
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
      <div className="mb-4">
        <Form layout="inline" className="gap-4">
           <Form.Item label="负责人"><Input placeholder="负责人" allowClear /></Form.Item>
           <Form.Item label="线索名称"><Input placeholder="线索名称" allowClear /></Form.Item>
           <Form.Item label="客户名称"><Input placeholder="客户名称" allowClear /></Form.Item>
           <Form.Item label="报备情况">
              <Select style={{width: 120}} options={[{value: true, label: '已报备'}, {value: false, label: '未报备'}]} allowClear />
           </Form.Item>
           <Form.Item label="回传情况">
              <Select style={{width: 120}} options={[{value: true, label: '已回传'}, {value: false, label: '未回传'}]} allowClear />
           </Form.Item>
           <Form.Item label="处理情况"><Input placeholder="处理情况" allowClear style={{width: 120}}/></Form.Item>
           <Form.Item label="视频生成">
              <Select style={{width: 100}} options={[{value: true, label: '是'}, {value: false, label: '否'}]} allowClear />
           </Form.Item>
           <Form.Item label="是否建群">
              <Select style={{width: 100}} options={[{value: true, label: '是'}, {value: false, label: '否'}]} allowClear />
           </Form.Item>
           <Form.Item><Button type="primary">查询</Button></Form.Item>
        </Form>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">报备信息管理</h3>
        <Button type="primary" onClick={() => handleOpenModal()}>新增报备</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        size="middle"
        scroll={{ x: 1300 }}
        pagination={{ 
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          defaultPageSize: 10 
        }} 
      />

      <Modal 
        title={editingRecord ? "编辑报备信息" : "新增报备"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="leadName" label="线索名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="person" label="负责人" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="isReported" label="是否报备" rules={[{ required: true }]}>
             <Select options={[{ value: true, label: '已报备' }, { value: false, label: '未报备' }]} />
          </Form.Item>
          <Form.Item name="isReturned" label="回传情况" rules={[{ required: true }]}>
             <Select options={[{ value: true, label: '已回传' }, { value: false, label: '未回传' }]} />
          </Form.Item>
          <Form.Item name="processingStatus" label="处理情况"><Input /></Form.Item>
          <Form.Item name="isVideoGenerated" label="是否生成视频">
             <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
          </Form.Item>
          <Form.Item name="isGroupCreated" label="是否建群">
             <Select options={[{ value: true, label: '是' }, { value: false, label: '否' }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
