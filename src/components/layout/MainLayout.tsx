'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Badge, Drawer } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { VIEW_MODES } from '@/lib/constants';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    currentView,
    setCurrentView,
    papers
  } = useAppStore();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setSidebarCollapsed, sidebarCollapsed]);

  const menuItems = [
    {
      key: VIEW_MODES.LIBRARY,
      icon: <BookOutlined />,
      label: 'Library',
    },
    {
      key: VIEW_MODES.READER,
      icon: <FileTextOutlined />,
      label: 'Reader',
    },
    {
      key: VIEW_MODES.COMPARISON,
      icon: <span>⚖️</span>,
      label: 'Compare',
    },
    {
      key: VIEW_MODES.ANALYSIS,
      icon: <BarChartOutlined />,
      label: 'Analysis',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'research-assistant',
      icon: <RobotOutlined />,
      label: 'Research Assistant',
    },
    {
      key: 'paper-timeline',
      icon: <ClockCircleOutlined />,
      label: 'Paper Timeline',
    },
    {
      key: 'collaboration-hub',
      icon: <TeamOutlined />,
      label: 'Collaboration Hub',
    },
    {
      key: 'smart-insights',
      icon: <ThunderboltOutlined />,
      label: 'Smart Insights',
    },
    {
      key: 'research-lab',
      icon: <ExperimentOutlined />,
      label: 'Research Lab',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = (key: string) => {
    setCurrentView(key as any);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // Handle profile
        break;
      case 'settings':
        // Handle settings
        break;
      case 'logout':
        // Handle logout
        break;
    }
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        {!sidebarCollapsed || isMobile ? (
          <Title level={3} className="text-gradient m-0">
            DocuMancer
          </Title>
        ) : (
          <div className="text-2xl font-bold text-gradient">D</div>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[currentView]}
        items={menuItems}
        onClick={({ key }) => {
          handleMenuClick(key);
          if (isMobile) {
            setMobileMenuVisible(false);
          }
        }}
        className="border-none"
        style={{ height: 'calc(100vh - 64px)' }}
      />
    </>
  );

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          width={240}
          className="bg-white border-r border-gray-200"
          style={{
            boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          }}
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title="DocuMancer"
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          styles={{ body: { padding: 0 } }}
          width={240}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout>
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                if (isMobile) {
                  setMobileMenuVisible(true);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="text-lg"
            />

            {!isMobile && (
              <div className="flex items-center space-x-2 text-gray-600">
                <BookOutlined />
                <span>{papers.length} Papers</span>
              </div>
            )}

            {isMobile && (
              <Title level={4} className="text-gradient m-0">
                DocuMancer
              </Title>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isMobile && (
              <>
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  className="text-lg"
                />

                <Badge count={5} size="small">
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    className="text-lg"
                  />
                </Badge>
              </>
            )}

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <Avatar size="small" icon={<UserOutlined />} />
                {!isMobile && <span className="text-sm font-medium">User</span>}
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content className={`bg-gray-50 overflow-hidden ${isMobile ? 'p-2' : 'p-4'}`}>
          <div className={`h-full ${isMobile ? 'max-w-full' : 'max-w-none'}`}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
