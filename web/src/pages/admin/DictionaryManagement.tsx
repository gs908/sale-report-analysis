import React, { useState, useEffect } from 'react';
import { Layout, Tree, Table, Button, Space, Modal, Form, Input, Switch, Popconfirm, notification, Spin } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DictType, DictItem, PageResult } from '../../api/admin';
import { getDictTypes, createDictType, updateDictType, deleteDictType, getDictItems, createDictItem, updateDictItem, deleteDictItem } from '../../api/admin';

const { Sider, Content } = Layout;

export default function DictionaryManagement() {
  const [types, setTypes] = useState<DictType[]>([]);
  const [items, setItems] = useState<DictItem[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [itemPagination, setItemPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    getDictTypes().then((res: PageResult<DictType>) => {
      const list = res.list || [];
      setTypes(list);
      if (list.length > 0) {
        setSelectedTypeId(list[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const fetchItems = (typeCode: string, current = 1, size = 10) => {
    getDictItems(typeCode, { current, size }).then((res: PageResult<DictItem>) => {
      setItems(res.list || []);
      setItemPagination({ current: res.current, pageSize: res.size, total: res.total });
    });
  };

  useEffect(() => {
    if (selectedType?.typeCode) {
      fetchItems(selectedType.typeCode);
    }
  }, [selectedTypeId]);

  const selectedType = types.find(t => t.id === selectedTypeId);

  const [editingType, setEditingType] = useState<DictType | null>(null);

  const handleEditType = (e: React.MouseEvent, type: DictType) => {
    e.stopPropagation();
    setEditingType(type);
    setIsTypeModalOpen(true);
  };

  useEffect(() => {
    if (isTypeModalOpen) {
      if (editingType) form.setFieldsValue(editingType);
      else {
        form.resetFields();
      }
    }
  }, [isTypeModalOpen, editingType]);

  const handleDeleteType = async (e: React.MouseEvent, typeId: number) => {
    e.stopPropagation();
    const hasItems = items?.some(i => i.typeCode === types.find(t => t.id === typeId)?.typeCode);
    if (hasItems) {
        notification.error({ message: '无法删除', description: '该类型下存在字典项，请先删除字典项。' });
        return;
    }
    Modal.confirm({
        title: '确认删除该类型？',
        onOk: async () => {
            await deleteDictType(String(typeId));
            setTypes(types.filter(t => t.id !== typeId));
            if (selectedTypeId === typeId) setSelectedTypeId('');
        }
    });
  };


  const treeData: DataNode[] = types.map(t => ({
    key: t.id,
    title: (
        <div className="flex justify-between items-center group w-full">
            <span>{t.typeName}</span>
            <Space className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button type="link" size="small" icon={<EditOutlined/>} onClick={(e) => handleEditType(e, t)} />
                <Button type="link" size="small" danger icon={<DeleteOutlined/>} onClick={(e) => handleDeleteType(e, t.id)} />
            </Space>
        </div>
    ),
  }));

  const [editingItem, setEditingItem] = useState<DictItem | null>(null);

  const handleEditItem = (item: DictItem) => {
      setEditingItem(item);
      setIsItemModalOpen(true);
  };

  useEffect(() => {
    if (isItemModalOpen) {
      if (editingItem) itemForm.setFieldsValue(editingItem);
      else itemForm.resetFields();
    }
  }, [isItemModalOpen, editingItem]);

  const handleDeleteItem = async (record: DictItem) => {
      Modal.confirm({
          title: '确定删除此字典项吗？',
          onOk: async () => {
              await deleteDictItem(record.id);
              fetchItems(selectedType?.typeCode || '', itemPagination.current, itemPagination.pageSize);
          }
      });
  };

  // ... (inside treeData/itemsColumns/Modal setup)
  const itemColumns: ColumnsType<DictItem> = [
    { title: '字典项名称', dataIndex: 'itemName', key: 'itemName' },
    { title: '编码', dataIndex: 'itemCode', key: 'itemCode' },
    { title: '显示顺序', dataIndex: 'sortOrder', key: 'sortOrder', sorter: (a, b) => a.sortOrder - b.sortOrder },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Switch size="small" checked={s === 'active'} /> },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEditItem(record)}>编辑</Button>
          <Button type="link" danger size="small" onClick={() => handleDeleteItem(record)}>删除</Button>
        </Space>
      )
    },
  ];


  const filteredItems = (items || []).filter(i => i.typeCode === selectedType?.typeCode);

  const handleAddItem = () => {
      if (!selectedTypeId) {
          notification.warning({ message: '请先选择左侧字典类型' });
          return;
      }
      itemForm.setFieldsValue({ typeCode: selectedType?.typeCode });
      setEditingItem(null);
      setIsItemModalOpen(true);
  };

  return (
    <Layout className="bg-white h-[calc(100vh-180px)] rounded-lg border border-slate-200 overflow-hidden">
      <Sider width={280} className="bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
           <h4 className="font-bold text-slate-700 m-0">字典类型</h4>
           <Button type="primary" size="small" icon={<PlusOutlined/>} onClick={() => setIsTypeModalOpen(true)} />
        </div>
        <div className="flex-1 overflow-y-auto">
            <Tree
              treeData={treeData}
              selectedKeys={[selectedTypeId]}
              onSelect={(keys) => setSelectedTypeId(keys[0] as number)}
              className="p-2 bg-slate-50"
              blockNode
            />
        </div>
      </Sider>
      <Content className="p-6 bg-white overflow-y-auto">
        <div className="mb-4 flex justify-between items-center pb-4 border-b">
          <h3 className="text-md font-bold text-slate-800">{selectedType ? `${selectedType.typeName} - 字典项管理` : '请选择字典类型'}</h3>
          <Button type="primary" icon={<PlusOutlined/>} onClick={handleAddItem}>新增字典项</Button>
        </div>
        <Spin spinning={loading}>
        <Table
          columns={itemColumns}
          dataSource={filteredItems || []}
          rowKey="id"
          size="middle"
          pagination={{
            current: itemPagination.current,
            pageSize: itemPagination.pageSize,
            total: itemPagination.total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => fetchItems(selectedType?.typeCode || '', page, pageSize)
          }}
        />
        </Spin>

        <Modal title={editingType ? "修改字典类型" : "新增字典类型"} open={isTypeModalOpen} onCancel={() => { setIsTypeModalOpen(false); setEditingType(null); form.resetFields(); }} onOk={() => form.submit()}>
           <Form form={form} layout="vertical" onFinish={async (values) => {
               if(editingType){
                   await updateDictType(String(editingType.id), values);
                   setTypes(types.map(t => t.id === editingType.id ? {...t, ...values} : t));
               } else {
                   const res = await createDictType(values);
                   setTypes([...types, { ...values, id: res.id || Date.now(), status: 'active' }]);
               }
               setIsTypeModalOpen(false);
               setEditingType(null);
               form.resetFields();
           }}>
             <Form.Item name="typeName" label="类型名称" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="typeCode" label="编码" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="description" label="描述"><Input.TextArea /></Form.Item>
           </Form>
        </Modal>

        <Modal 
          title={editingItem ? "编辑字典项" : "新增字典项"} 
          open={isItemModalOpen} 
          onCancel={() => { setIsItemModalOpen(false); setEditingItem(null); itemForm.resetFields(); }} 
          onOk={() => itemForm.submit()}
        >
           <Form form={itemForm} layout="vertical" onFinish={async (values) => {
               if(editingItem) {
                   await updateDictItem(String(editingItem.id), values);
               } else {
                   await createDictItem({ ...values, typeCode: selectedType?.typeCode });
               }
               fetchItems(selectedType?.typeCode || '', itemPagination.current, itemPagination.pageSize);
               setIsItemModalOpen(false);
               setEditingItem(null);
               itemForm.resetFields();
           }}>
             <Form.Item name="typeCode" label="所属字典类型"><Input disabled value={selectedType?.typeCode} /></Form.Item>
             <Form.Item name="itemName" label="字典项名称" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="itemCode" label="编码" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="sortOrder" label="显示顺序"><Input type="number" /></Form.Item>
           </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
