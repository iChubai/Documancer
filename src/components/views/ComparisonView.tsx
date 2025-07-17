'use client';

import React from 'react';
import { Card, Typography, Button, Empty } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { VIEW_MODES } from '@/lib/constants';

const { Title } = Typography;

const ComparisonView: React.FC = () => {
  const { setCurrentView } = useAppStore();

  const handleGoToLibrary = () => {
    setCurrentView(VIEW_MODES.LIBRARY);
  };

  return (
    <div className="p-6 h-full">
      <Title level={2} className="mb-6">
        Paper Comparison
      </Title>
      
      <Card className="h-full">
        <div className="flex items-center justify-center h-full">
          <Empty
            image={<SwapOutlined className="text-6xl text-gray-400" />}
            description="Paper comparison feature coming soon"
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

export default ComparisonView;
