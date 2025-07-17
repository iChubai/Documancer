'use client';

import React from 'react';
import { Card, Typography, Button, Empty } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { VIEW_MODES } from '@/lib/constants';

const { Title } = Typography;

const AnalysisView: React.FC = () => {
  const { setCurrentView } = useAppStore();

  const handleGoToLibrary = () => {
    setCurrentView(VIEW_MODES.LIBRARY);
  };

  return (
    <div className="p-6 h-full">
      <Title level={2} className="mb-6">
        Paper Analysis
      </Title>
      
      <Card className="h-full">
        <div className="flex items-center justify-center h-full">
          <Empty
            image={<BarChartOutlined className="text-6xl text-gray-400" />}
            description="Advanced analysis features coming soon"
          >
            <Button type="primary" onClick={handleGoToLibrary}>
              Go to Library
            </Button>
          </Empty>
        </div>
      </Card>
    </div>
  );
};

export default AnalysisView;
