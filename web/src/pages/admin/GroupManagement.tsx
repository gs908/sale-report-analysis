import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Drawer, Popconfirm, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GroupRecord, MemberRecord, PageResult } from '../../api/admin';
import { getGroups, createGroup, updateGroup, dissolveGroup, addGroupMember, updateGroupMember, removeGroupMember } from '../../api/admin';

export default function GroupManagement() {
  const [data, setData] = useState<GroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Drawer state for Member Management
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<GroupRecord | null>(null);
  const [form] = Form.useForm();

  const fetchGroups = (current = 1, size = 10) => {
    setLoading(true);
    getGroups({ current, size }).then((res: PageResult<GroupRecord>) => {
      setData(res.list || []);
      setPagination({ current: res.current, pageSize: res.size, total: res.total });
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenModal = (record?: GroupRecord) => {
    setEditingGroup(record || null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingGroup) {
        form.setFieldsValue(editingGroup);
      } else {
        form.resetFields();
        form.setFieldsValue({ status: '正常' });
      }
    }
  }, [isModalOpen, editingGroup]);

  const handleSave = async (values: any) => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, values);
      setData((data || []).map(item => item.id === editingGroup.id ? { ...item, ...values } : item));
    } else {
      await createGroup(values);
      fetchGroups(pagination.current, pagination.pageSize);
    }
    setIsModalOpen(false);
  };

  const showConfirmDissolve = (id: string) => {
    Modal.confirm({
      title: '确定解散该群？',
      content: '解散后将无法撤销，该群状态将变更为”已解散”。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => handleDissolve(id),
    });
  };

  const handleDissolve = async (id: string) => {
    await dissolveGroup(id);
    fetchGroups(pagination.current, pagination.pageSize);
  };

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [memberForm] = Form.useForm();

  const handleOpenMemberModal = (record?: MemberRecord) => {
    setEditingMember(record || null);
    setIsMemberModalOpen(true);
  };

  useEffect(() => {
    if (isMemberModalOpen) {
      if (editingMember) memberForm.setFieldsValue(editingMember);
      else memberForm.resetFields();
    }
  }, [isMemberModalOpen, editingMember]);

  const handleSaveMember = async (values: any) => {
    if (!currentGroup) return;

    let updatedMembers;
    if (editingMember) {
      await updateGroupMember(currentGroup.id, editingMember.id, values);
      updatedMembers = currentGroup.members.map(m => m.id === editingMember.id ? { ...m, ...values } : m);
    } else {
      const res = await addGroupMember(currentGroup.id, values);
      updatedMembers = [...currentGroup.members, { id: res.id || Date.now().toString(), ...values }];
    }

    const updatedGroup = { ...currentGroup, members: updatedMembers };
    setCurrentGroup(updatedGroup);
    setData((data || []).map(g => g.id === updatedGroup.id ? updatedGroup : g));
    setIsMemberModalOpen(false);
  };

  const columns: ColumnsType<GroupRecord> = [
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
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setCurrentGroup(record); setMemberDrawerOpen(true); }}>成员管理 ({record.members.length})</Button>
          <Button type="link" size="small" onClick={() => handleOpenModal(record)}>编辑</Button>
          {record.status === '正常' && (
            <Button type="link" danger size="small" onClick={() => showConfirmDissolve(record.id)}>解散</Button>
          )}
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
      render: (_, record, index) => (
        <Space>
           <Button type="link" size="small" onClick={() => handleOpenMemberModal(record)}>编辑</Button>
           <Popconfirm title="确定移除此成员？" onConfirm={async () => {
              if (currentGroup && currentGroup.members[index]) {
                await removeGroupMember(currentGroup.id, currentGroup.members[index].id);
                const newMembers = [...currentGroup.members];
                newMembers.splice(index, 1);
                const updatedGroup = { ...currentGroup, members: newMembers };
                setCurrentGroup(updatedGroup);
                setData((data || []).map(g => g.id === updatedGroup.id ? updatedGroup : g));
              }
           }}>
              <Button type="link" danger size="small">移除</Button>
           </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">群管理</h3>
        <Button type="primary" onClick={() => handleOpenModal()}>新建群</Button>
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
          defaultPageSize: 10,
          onChange: (page, pageSize) => fetchGroups(page, pageSize)
        }}
      />
      </Spin>

      {/* Add/Edit Modal */}
      <Modal 
        title={editingGroup ? "编辑群信息" : "新建群"}
        open={isModalOpen} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="群名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="archiveId" label="会话存档ID"><Input /></Form.Item>
          <Form.Item name="leadId" label="线索编号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="leadName" label="线索名称"><Input /></Form.Item>
          <Form.Item name="status" label="群状态" rules={[{ required: true }]}>
            <Select options={[{ value: '正常', label: '正常' }, { value: '已解散', label: '已解散' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Member Management Drawer */}
      <Drawer
        title={`成员管理 - ${currentGroup?.name || ''}`}
        placement="right"
        size={500}
        onClose={() => setMemberDrawerOpen(false)}
        open={memberDrawerOpen}
      >
        <div className="mb-4">
           <Button type="primary" block onClick={() => handleOpenMemberModal()}>
             + 添加群成员
           </Button>
        </div>
        <Table columns={memberColumns as any} dataSource={currentGroup?.members || []} rowKey="id" pagination={false} size="small" />
      </Drawer>

      {/* Member Add/Edit Modal */}
      <Modal 
        title={editingMember ? "编辑成员" : "添加成员"}
        open={isMemberModalOpen} 
        onOk={() => memberForm.submit()} 
        onCancel={() => setIsMemberModalOpen(false)}
        destroyOnHidden
      >
        <Form form={memberForm} layout="vertical" onFinish={handleSaveMember}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label="序列" rules={[{ required: true }]}>
             <Select options={[{value: '管理', label: '管理'}, {value: '市场', label: '市场'}, {value: '工程', label: '工程'}, {value: 'BA', label: 'BA'}]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
