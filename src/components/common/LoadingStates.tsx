'use client';

import React from 'react';
import { Spin, Progress, Card, Typography, Space, Skeleton } from 'antd';
import {
  LoadingOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  message,
  className = '',
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24 }} spin />;

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Spin indicator={antIcon} size={size} />
      {message && (
        <Text className="mt-4 text-gray-600 text-center">
          {message}
        </Text>
      )}
    </div>
  );
};

interface ProgressLoadingProps {
  progress: number;
  message?: string;
  subMessage?: string;
  className?: string;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress,
  message,
  subMessage,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          {message && (
            <Text strong className="text-lg">
              {message}
            </Text>
          )}
          {subMessage && (
            <div className="text-sm text-gray-600 mt-1">
              {subMessage}
            </div>
          )}
        </div>
        
        <Progress
          percent={progress}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          trailColor="#f0f0f0"
          strokeWidth={8}
          className="progress-loading"
        />
        
        <div className="text-center text-sm text-gray-500">
          {progress}% complete
        </div>
      </div>
    </div>
  );
};

interface StepLoadingProps {
  steps: Array<{
    title: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  currentStep: number;
  className?: string;
}

export const StepLoading: React.FC<StepLoadingProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`p-8 ${className}`}>
      <div className="max-w-md mx-auto space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-50 border border-blue-200'
                  : isCompleted
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isActive ? (
                  <Spin size="small" />
                ) : isCompleted ? (
                  '✓'
                ) : (
                  step.icon || index + 1
                )}
              </div>
              
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    isActive
                      ? 'text-blue-700'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-sm text-gray-500">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Specific loading components for different features
export const PDFProcessingLoader: React.FC<{ fileName?: string }> = ({ fileName }) => {
  const steps = [
    {
      title: 'Uploading file',
      description: 'Transferring your PDF to the server',
      icon: <CloudUploadOutlined />,
    },
    {
      title: 'Processing PDF',
      description: 'Extracting text and metadata',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Analyzing content',
      description: 'Preparing for AI analysis',
      icon: <BrainOutlined />,
    },
  ];

  return (
    <Card className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <Title level={4}>Processing PDF</Title>
        {fileName && (
          <Text type="secondary">
            {fileName}
          </Text>
        )}
      </div>
      <StepLoading steps={steps} currentStep={1} />
    </Card>
  );
};

export const AIAnalysisLoader: React.FC<{ analysisType?: string }> = ({ analysisType }) => {
  return (
    <div className="text-center p-8">
      <div className="mb-4">
        <div className="text-4xl text-blue-500 animate-pulse">🧠</div>
      </div>
      <Title level={4}>AI Analysis in Progress</Title>
      <Text type="secondary">
        {analysisType ? `Performing ${analysisType.toLowerCase()}...` : 'Analyzing your document...'}
      </Text>
      <div className="mt-4">
        <LoadingSpinner size="large" />
      </div>
    </div>
  );
};

export const SearchLoader: React.FC<{ query?: string }> = ({ query }) => {
  return (
    <div className="text-center p-8">
      <div className="mb-4">
        <SearchOutlined className="text-4xl text-green-500 animate-pulse" />
      </div>
      <Title level={4}>Searching...</Title>
      {query && (
        <Text type="secondary">
          Looking for "{query}"
        </Text>
      )}
      <div className="mt-4">
        <LoadingSpinner />
      </div>
    </div>
  );
};

// Skeleton loaders for different content types
export const PaperCardSkeleton: React.FC = () => {
  return (
    <Card className="h-full">
      <Skeleton
        active
        avatar={{ size: 'large', shape: 'square' }}
        paragraph={{ rows: 4 }}
        title={{ width: '80%' }}
      />
      <div className="mt-4 flex space-x-2">
        <Skeleton.Button size="small" />
        <Skeleton.Button size="small" />
        <Skeleton.Button size="small" />
      </div>
    </Card>
  );
};

export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="flex space-x-3 mb-4">
      <Skeleton.Avatar size="default" />
      <div className="flex-1">
        <Skeleton
          active
          paragraph={{ rows: 2, width: ['60%', '40%'] }}
          title={false}
        />
      </div>
    </div>
  );
};

export const LibraryViewSkeleton: React.FC = () => {
  return (
    <div className="p-6">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton.Input style={{ width: 200, height: 32 }} active />
        <div className="mt-4">
          <Skeleton.Input style={{ width: '100%', height: 40 }} active />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <PaperCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const ReaderViewSkeleton: React.FC = () => {
  return (
    <div className="h-full flex">
      {/* PDF viewer skeleton */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <Skeleton.Input style={{ width: 150, height: 32 }} active />
        </div>
        <Card className="h-full">
          <Skeleton
            active
            paragraph={{ rows: 20 }}
            title={{ width: '60%' }}
          />
        </Card>
      </div>

      {/* Sidebar skeleton */}
      <div className="w-96 border-l p-4">
        <div className="space-y-4">
          <Skeleton.Input style={{ width: '100%', height: 40 }} active />
          {Array.from({ length: 5 }).map((_, index) => (
            <ChatMessageSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}> = ({ loading, children, message }) => {
  return (
    <Spin spinning={loading} tip={message}>
      {children}
    </Spin>
  );
};

export default LoadingSpinner;
