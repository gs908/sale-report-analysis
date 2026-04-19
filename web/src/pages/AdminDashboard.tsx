import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  TeamOutlined, 
  MessageOutlined, 
  FileTextOutlined, 
  UsergroupAddOutlined, 
  VideoCameraOutlined, 
  AppstoreOutlined,
  LeftOutlined,
  SettingOutlined,
  RobotOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

// Import Admin Pages
import GroupManagement from './admin/GroupManagement';
import MessageManagement from './admin/MessageManagement';
import ReportInfoManagement from './admin/ReportInfoManagement';
import FixedMemberManagement from './admin/FixedMemberManagement';
import PipelineManagement from './admin/PipelineManagement';
import TemplateManagement from './admin/TemplateManagement';
import DictionaryManagement from './admin/DictionaryManagement';
import AgentRegistrationManagement from './admin/AgentRegistration';

const { Header, Sider, Content } = Layout;

export default function AdminDashboard() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/admin/groups', icon: <TeamOutlined />, label: <Link to="/admin/groups">群管理</Link> },
    { key: '/admin/messages', icon: <MessageOutlined />, label: <Link to="/admin/messages">群消息管理</Link> },
    { key: '/admin/reports', icon: <FileTextOutlined />, label: <Link to="/admin/reports">报备信息管理</Link> },
    { key: '/admin/pipeline', icon: <VideoCameraOutlined />, label: <Link to="/admin/pipeline">报告生成管理</Link> },
    { key: '/admin/templates', icon: <AppstoreOutlined />, label: <Link to="/admin/templates">消息模板管理</Link> },
    { 
      key: 'system', 
      icon: <SettingOutlined />, 
      label: '系统管理',
      children: [
        { key: '/admin/dictionary', icon: <DatabaseOutlined />, label: <Link to="/admin/dictionary">字典管理</Link> },
        { key: '/admin/fixed-members', icon: <UsergroupAddOutlined />, label: <Link to="/admin/fixed-members">固定成员配置</Link> },
      ]
    },
    { key: '/admin/agent', icon: <RobotOutlined />, label: <Link to="/admin/agent">Agent 管理</Link> },
  ];

  // Map sub routes to keys if necessary to keep menu active state
  let selectedKey = location.pathname;
  if (selectedKey === '/admin') selectedKey = '/admin/groups';

  return (
    <Layout className="min-h-screen">
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="light" width={220}>
        <div className="h-16 flex items-center justify-center border-b border-slate-100 mb-2">
          {!collapsed ? (
            <div className="font-bold text-slate-800 text-lg tracking-tight">系统管理后台</div>
          ) : (
            <div className="font-black text-slate-800 text-xl tracking-tight">系</div>
          )}
        </div>
        <Menu 
           mode="inline" 
           selectedKeys={[selectedKey]} 
           items={menuItems} 
           className="border-r-0 font-medium text-slate-600"
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 border-b border-slate-200 flex items-center shadow-sm relative z-10 gap-4">
          <Link to="/" className="flex items-center text-slate-500 hover:text-blue-600 transition-colors">
             <LeftOutlined className="mr-1" />
             <span className="font-medium text-sm">返回数据看版</span>
          </Link>
          <div className="h-4 w-px bg-slate-300"></div>
          <h2 className="text-base font-semibold text-slate-800 m-0">
             {menuItems.find(m => m.key === selectedKey)?.label?.props?.children || '后台管理'}
          </h2>
        </Header>
        <Content className="p-4 sm:p-6 bg-[#f3f4f6]">
          <div className="bg-white p-6 min-h-full rounded-xl shadow-sm border border-slate-200">
            <Routes>
              <Route path="/" element={<GroupManagement />} />
              <Route path="groups" element={<GroupManagement />} />
              <Route path="messages" element={<MessageManagement />} />
              <Route path="reports" element={<ReportInfoManagement />} />
              <Route path="pipeline" element={<PipelineManagement />} />
              <Route path="templates" element={<TemplateManagement />} />
              <Route path="dictionary" element={<DictionaryManagement />} />
              <Route path="fixed-members" element={<FixedMemberManagement />} />
              <Route path="agent" element={<AgentRegistrationManagement />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
