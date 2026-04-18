import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Tag, Row, Col, Divider, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

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
  const [queryForm] = Form.useForm();

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
      render: (val) => val ? <Tag color="success">已报备</Tag> : <Tag color="default">未报备</Tag>
    },
    { 
      title: '回传情况', 
      dataIndex: 'isReturned', 
      key: 'isReturned', 
      width: 100, 
      render: (v) => v ? <Tag color="success">已回传</Tag> : <Tag color="default">未回传</Tag>
    },
    { title: '处理情况', dataIndex: 'processingStatus', key: 'processingStatus', width: 100 },
    { title: '视频生成', dataIndex: 'isVideoGenerated', key: 'isVideoGenerated', width: 100, render: (v) => v ? '是' : '否' },
    { title: '是否建群', dataIndex: 'isGroupCreated', key: 'isGroupCreated', width: 100, render: (v) => v ? '是' : '否' },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 150 },
    { 
      title: '操作', 
      key: 'action', 
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle" orientation="horizontal">
          <Button type="link" size="small" onClick={() => handleOpenModal(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ) 
    },
  ];


  return (
    <div>
      {/* 1. 顶部标题 */}
      <Title level={4} style={{ marginBottom: 24 }}>报备信息管理</Title>
      
      {/* 2. 筛选区：补全所有筛选字段 */}
      <Form form={queryForm} layout="vertical">
        <Row gutter={24}>
           <Col span={6}><Form.Item name="person" label="负责人"><Input placeholder="负责人" allowClear /></Form.Item></Col>
           <Col span={6}><Form.Item name="leadName" label="线索名称"><Input placeholder="线索名称" allowClear /></Form.Item></Col>
           <Col span={6}><Form.Item name="customerName" label="客户名称"><Input placeholder="客户名称" allowClear /></Form.Item></Col>
           <Col span={6}><Form.Item name="isReported" label="报备情况">
              <Select options={[{value: true, label: '已报备'}, {value: false, label: '未报备'}]} allowClear />
           </Form.Item></Col>
           <Col span={6}><Form.Item name="isReturned" label="回传情况">
              <Select options={[{value: true, label: '已回传'}, {value: false, label: '未回传'}]} allowClear />
           </Form.Item></Col>
           <Col span={6}><Form.Item name="processingStatus" label="处理情况"><Input placeholder="处理情况" allowClear /></Form.Item></Col>
           <Col span={6}><Form.Item name="isVideoGenerated" label="视频生成">
              <Select options={[{value: true, label: '是'}, {value: false, label: '否'}]} allowClear />
           </Form.Item></Col>
           <Col span={6}><Form.Item name="isGroupCreated" label="是否建群">
              <Select options={[{value: true, label: '是'}, {value: false, label: '否'}]} allowClear />
           </Form.Item></Col>
           <Col span={24} style={{ textAlign: 'right' }}>
              <Button onClick={() => queryForm.resetFields()}>重置</Button>
              <Button type="primary" style={{ marginLeft: 8 }}>查询</Button>
           </Col>
        </Row>
      </Form>
      
      <Divider dashed />

      {/* 3. 表格工具栏区：新增按钮放左侧 */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>新增报备</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        size="middle"
        scroll={{ x: 1300 }}
        pagination={{ 
          placement: 'bottomRight',
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
