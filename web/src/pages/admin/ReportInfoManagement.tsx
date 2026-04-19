import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Popconfirm, Tag, Row, Col, Divider, Typography, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ReportRecord, PageResult } from '../../api/admin';
import { getReports, createReport, updateReport, deleteReport } from '../../api/admin';

const { Title } = Typography;

export default function ReportInfoManagement() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReportRecord | null>(null);
  const [form] = Form.useForm();
  const [queryForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = (current = 1, size = 10) => {
    setLoading(true);
    getReports({ current, size }).then((res: PageResult<ReportRecord>) => {
      setData(res.list || []);
      setPagination({ current: res.current, pageSize: res.size, total: res.total });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (record?: ReportRecord) => {
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingRecord) form.setFieldsValue(editingRecord);
      else {
        form.resetFields();
        form.setFieldsValue({ isReported: false, status: '未报备' });
      }
    }
  }, [isModalOpen, editingRecord]);

  const handleSave = async (values: any) => {
    if (editingRecord) {
      await updateReport(editingRecord.id, values);
      setData((data || []).map(item => item.id === editingRecord.id ? { ...item, ...values } : item));
    } else {
      await createReport(values);
      fetchData(pagination.current, pagination.pageSize);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteReport(id);
    fetchData(pagination.current, pagination.pageSize);
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

      <Spin spinning={loading}>
      <Table
        columns={columns}
        dataSource={data || []}
        rowKey="id"
        size="middle"
        scroll={{ x: 1300 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          placement: 'bottomRight',
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          onChange: (page, pageSize) => fetchData(page, pageSize)
        }}
      />
      </Spin>

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
