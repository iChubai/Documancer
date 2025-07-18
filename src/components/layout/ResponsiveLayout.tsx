'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Button, Grid } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  showSidebar?: boolean;
  sidebarWidth?: number;
}

/**
 * Responsive layout component that adapts to different screen sizes
 * Provides mobile-first design with collapsible sidebar
 */
export default function ResponsiveLayout({
  children,
  sidebar,
  header,
  showSidebar = true,
  sidebarWidth = 300
}: ResponsiveLayoutProps) {
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  // Determine if we're on mobile
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, sidebarCollapsed, setSidebarCollapsed]);

  /**
   * Toggle mobile drawer
   */
  const toggleMobileDrawer = () => {
    setMobileDrawerVisible(!mobileDrawerVisible);
  };

  /**
   * Close mobile drawer
   */
  const closeMobileDrawer = () => {
    setMobileDrawerVisible(false);
  };

  /**
   * Toggle desktop sidebar
   */
  const toggleDesktopSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <Layout className="h-screen">
        {/* Mobile Header */}
        <Header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-14 leading-none">
          {showSidebar && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMobileDrawer}
              className="flex items-center justify-center"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {header}
          </div>
        </Header>

        {/* Mobile Content */}
        <Content className="flex-1 overflow-hidden bg-gray-50">
          {children}
        </Content>

        {/* Mobile Drawer */}
        {showSidebar && (
          <Drawer
            title={
              <div className="flex items-center justify-between">
                <span>菜单</span>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={closeMobileDrawer}
                  size="small"
                />
              </div>
            }
            placement="left"
            onClose={closeMobileDrawer}
            open={mobileDrawerVisible}
            width={Math.min(sidebarWidth, window.innerWidth * 0.8)}
            bodyStyle={{ padding: 0 }}
            headerStyle={{ padding: '16px 24px' }}
          >
            <div className="h-full overflow-auto">
              {sidebar}
            </div>
          </Drawer>
        )}
      </Layout>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <Layout className="h-screen">
        {/* Tablet Header */}
        <Header className="bg-white border-b border-gray-200 px-6 flex items-center h-16 leading-none">
          {showSidebar && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleDesktopSidebar}
              className="mr-4"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {header}
          </div>
        </Header>

        <Layout>
          {/* Tablet Sidebar */}
          {showSidebar && (
            <Sider
              width={sidebarWidth}
              collapsed={sidebarCollapsed}
              collapsedWidth={0}
              trigger={null}
              className="bg-white border-r border-gray-200"
              style={{
                overflow: 'auto',
                height: 'calc(100vh - 64px)',
              }}
            >
              <div className="h-full overflow-auto">
                {sidebar}
              </div>
            </Sider>
          )}

          {/* Tablet Content */}
          <Content className="flex-1 overflow-hidden bg-gray-50">
            {children}
          </Content>
        </Layout>
      </Layout>
    );
  }

  // Desktop Layout
  return (
    <Layout className="h-screen">
      {/* Desktop Header */}
      <Header className="bg-white border-b border-gray-200 px-6 flex items-center h-16 leading-none">
        {showSidebar && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={toggleDesktopSidebar}
            className="mr-4"
          />
        )}
        
        <div className="flex-1 min-w-0">
          {header}
        </div>
      </Header>

      <Layout>
        {/* Desktop Sidebar */}
        {showSidebar && (
          <Sider
            width={sidebarWidth}
            collapsed={sidebarCollapsed}
            collapsedWidth={80}
            trigger={null}
            className="bg-white border-r border-gray-200"
            style={{
              overflow: 'auto',
              height: 'calc(100vh - 64px)',
            }}
          >
            <div className="h-full overflow-auto">
              {sidebar}
            </div>
          </Sider>
        )}

        {/* Desktop Content */}
        <Content className="flex-1 overflow-hidden bg-gray-50">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 