'use client';

import React, { useState, useEffect } from 'react';
import { Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarWidth?: number;
  breakpoint?: number;
  className?: string;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  sidebar,
  sidebarWidth = 320,
  breakpoint = 768,
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { sidebarCollapsed } = useAppStore();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  const handleDrawerClose = () => {
    setMobileDrawerOpen(false);
  };

  if (isMobile && sidebar) {
    return (
      <div className={`relative ${className}`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileDrawerOpen(true)}
            className="text-lg"
          />
          <div className="text-lg font-semibold text-gradient">DocuMancer</div>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="h-full">
          {children}
        </div>

        {/* Mobile Sidebar Drawer */}
        <Drawer
          title="Navigation"
          placement="left"
          onClose={handleDrawerClose}
          open={mobileDrawerOpen}
          width={sidebarWidth}
          className="mobile-sidebar-drawer"
          styles={{ body: { padding: 0 } }}
        >
          {sidebar}
        </Drawer>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`flex h-full ${className}`}>
      {sidebar && (
        <div 
          className={`transition-all duration-300 ${
            sidebarCollapsed ? 'w-20' : `w-${sidebarWidth}`
          }`}
          style={{ width: sidebarCollapsed ? 80 : sidebarWidth }}
        >
          {sidebar}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveContainer;
