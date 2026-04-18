import React, { useState } from 'react';
import { Layout, Tree, Table, Button, Space, Modal, Form, Input, Switch, Popconfirm, notification, Tooltip } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

interface DictType {
  id: string;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
}

interface DictItem {
  id: string;
  typeId: string;
  name: string;
  code: string;
  value: string;
  order: number;
  enabled: boolean;
}

const mockDictTypes: DictType[] = [
  { id: '1', name: '线索状态', code: 'LEAD_STATUS', description: '线索的处理状态', enabled: true },
  { id: '2', name: '报备情况', code: 'REPORT_STATUS', description: '报备情况分类', enabled: true },
];

const mockDictItems: DictItem[] = [
  { id: '101', typeId: '1', name: '已处理', code: 'PROCESSED', value: '1', order: 1, enabled: true },
  { id: '102', typeId: '1', name: '未处理', code: 'UNPROCESSED', value: '0', order: 2, enabled: true },
];

export default function DictionaryManagement() {
  const [types, setTypes] = useState<DictType[]>(mockDictTypes);
  const [items, setItems] = useState<DictItem[]>(mockDictItems);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(mockDictTypes[0]?.id || '');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();

  const selectedType = types.find(t => t.id === selectedTypeId);

  const [editingType, setEditingType] = useState<DictType | null>(null);

  const handleEditType = (e: React.MouseEvent, type: DictType) => {
    e.stopPropagation();
    setEditingType(type);
    form.setFieldsValue(type);
    setIsTypeModalOpen(true);
  };

  const handleDeleteType = (e: React.MouseEvent, typeId: string) => {
    e.stopPropagation();
    const hasItems = items.some(i => i.typeId === typeId);
    if (hasItems) {
        notification.error({ message: '无法删除', description: '该类型下存在字典项，请先删除字典项。' });
        return;
    }
    Modal.confirm({
        title: '确认删除该类型？',
        onOk: () => {
            setTypes(types.filter(t => t.id !== typeId));
            if (selectedTypeId === typeId) setSelectedTypeId('');
        }
    });
  };


  const treeData: DataNode[] = types.map(t => ({
    key: t.id,
    title: (
        <div className="flex justify-between items-center group w-full">
            <span>{t.name}</span>
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
      itemForm.setFieldsValue(item);
      setIsItemModalOpen(true);
  };

  const handleDeleteItem = (record: DictItem) => {
      Modal.confirm({
          title: '确定删除此字典项吗？',
          onOk: () => setItems(items.filter(i => i.id !== record.id))
      });
  };

  // ... (inside treeData/itemsColumns/Modal setup)
  const itemColumns: ColumnsType<DictItem> = [
    { title: '字典项名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '值', dataIndex: 'value', key: 'value' },
    { title: '显示顺序', dataIndex: 'order', key: 'order', sorter: (a, b) => a.order - b.order },
    { title: '是否启用', dataIndex: 'enabled', key: 'enabled', render: (e) => <Switch size="small" checked={e} /> },
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


  const filteredItems = items.filter(i => i.typeId === selectedTypeId);

  const handleAddItem = () => {
      if (!selectedTypeId) {
          notification.warning({ message: '请先选择左侧字典类型' });
          return;
      }
      itemForm.setFieldsValue({ typeId: selectedType?.name });
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
              onSelect={(keys) => setSelectedTypeId(keys[0] as string)}
              className="p-2 bg-slate-50"
              blockNode
            />
        </div>
      </Sider>
      <Content className="p-6 bg-white overflow-y-auto">
        <div className="mb-4 flex justify-between items-center pb-4 border-b">
          <h3 className="text-md font-bold text-slate-800">{selectedType ? `${selectedType.name} - 字典项管理` : '请选择字典类型'}</h3>
          <Button type="primary" icon={<PlusOutlined/>} onClick={handleAddItem}>新增字典项</Button>
        </div>
        <Table 
          columns={itemColumns} 
          dataSource={filteredItems} 
          rowKey="id" 
          size="middle"
          pagination={{ showTotal: (t) => `共 ${t} 条` }}
        />

        <Modal title={editingType ? "修改字典类型" : "新增字典类型"} open={isTypeModalOpen} onCancel={() => { setIsTypeModalOpen(false); setEditingType(null); form.resetFields(); }} onOk={() => form.submit()}>
           <Form form={form} layout="vertical" onFinish={(values) => {
               if(editingType){
                   setTypes(types.map(t => t.id === editingType.id ? {...t, ...values} : t));
               } else {
                   setTypes([...types, { ...values, id: String(Date.now()), enabled: true }]);
               }
               setIsTypeModalOpen(false);
               setEditingType(null);
               form.resetFields();
           }}>
             <Form.Item name="name" label="类型名称" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="code" label="编码" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="description" label="描述"><Input.TextArea /></Form.Item>
           </Form>
        </Modal>

        <Modal 
          title={editingItem ? "编辑字典项" : "新增字典项"} 
          open={isItemModalOpen} 
          onCancel={() => { setIsItemModalOpen(false); setEditingItem(null); itemForm.resetFields(); }} 
          onOk={() => itemForm.submit()}
        >
           <Form form={itemForm} layout="vertical" onFinish={(values) => {
               if(editingItem) {
                   setItems(items.map(i => i.id === editingItem.id ? {...i, ...values} : i));
               } else {
                   setItems([...items, {...values, typeId: selectedTypeId, id: String(Date.now())}]);
               }
               setIsItemModalOpen(false);
               setEditingItem(null);
               itemForm.resetFields();
           }}>
             <Form.Item name="typeId" label="所属字典类型"><Input disabled /></Form.Item>
             <Form.Item name="name" label="字典项名称" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="code" label="编码" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="value" label="值" rules={[{required: true}]}><Input /></Form.Item>
             <Form.Item name="order" label="显示顺序"><Input type="number" /></Form.Item>
           </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
