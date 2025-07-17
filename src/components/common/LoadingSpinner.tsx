'use client';

import React from 'react';
import { Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  message?: string;
  className?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  message,
  className = '',
  spinning = true,
  children,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24 }} spin />;

  if (children) {
    return (
      <Spin 
        spinning={spinning} 
        indicator={antIcon} 
        tip={message}
        className={className}
      >
        {children}
      </Spin>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Spin 
        indicator={antIcon} 
        size={size}
      />
      {message && (
        <Text className="mt-4 text-gray-600 text-center">
          {message}
        </Text>
      )}
    </div>
  );
};

export default LoadingSpinner;
