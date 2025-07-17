'use client';

import React from 'react';
import { Alert, Button, Card, Collapse, Typography, Space, Tag } from 'antd';
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { AppError, getErrorRecoverySuggestions } from '@/lib/error-handler';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ErrorDisplayProps {
  error: AppError | Error | string;
  showDetails?: boolean;
  showSuggestions?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  showDetails = false,
  showSuggestions = true,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const getErrorInfo = () => {
    if (typeof error === 'string') {
      return {
        message: error,
        code: 'UNKNOWN_ERROR',
        context: 'Unknown',
        details: null,
        timestamp: new Date(),
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        context: 'Unknown',
        details: { stack: error.stack },
        timestamp: new Date(),
      };
    }

    return error;
  };

  const errorInfo = getErrorInfo();
  const suggestions = showSuggestions ? getErrorRecoverySuggestions(errorInfo as any) : [];

  const getErrorType = (code: string) => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'error';
      case 'VALIDATION_ERROR':
        return 'warning';
      case 'FILE_PROCESSING_ERROR':
        return 'error';
      case 'API_ERROR':
        return 'error';
      default:
        return 'error';
    }
  };

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'NETWORK_ERROR':
        return '🌐';
      case 'VALIDATION_ERROR':
        return '⚠️';
      case 'FILE_PROCESSING_ERROR':
        return '📄';
      case 'API_ERROR':
        return '🔌';
      default:
        return '❌';
    }
  };

  return (
    <div className={className}>
      <Alert
        message={
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getErrorIcon(errorInfo.code)}</span>
            <span>Something went wrong</span>
            {errorInfo.context && (
              <Tag color="red" size="small">
                {errorInfo.context}
              </Tag>
            )}
          </div>
        }
        description={
          <div className="space-y-3">
            <Paragraph className="mb-0">
              {errorInfo.message}
            </Paragraph>

            {/* Action Buttons */}
            <Space>
              {onRetry && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={onRetry}
                  size="small"
                >
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button
                  icon={<CloseOutlined />}
                  onClick={onDismiss}
                  size="small"
                >
                  Dismiss
                </Button>
              )}
            </Space>

            {/* Recovery Suggestions */}
            {suggestions.length > 0 && (
              <Card size="small" className="bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-2">
                  <InfoCircleOutlined className="text-blue-500 mt-1" />
                  <div>
                    <Text strong className="text-blue-700">
                      Try these solutions:
                    </Text>
                    <ul className="mt-2 mb-0 text-sm text-blue-600">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="mb-1">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Details */}
            {showDetails && errorInfo.details && (
              <Collapse size="small" ghost>
                <Panel
                  header={
                    <Space>
                      <BugOutlined />
                      <Text type="secondary">Technical Details</Text>
                    </Space>
                  }
                  key="details"
                >
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="space-y-2 text-sm">
                      <div>
                        <Text strong>Error Code:</Text> {errorInfo.code}
                      </div>
                      <div>
                        <Text strong>Timestamp:</Text>{' '}
                        {errorInfo.timestamp.toLocaleString()}
                      </div>
                      {errorInfo.context && (
                        <div>
                          <Text strong>Context:</Text> {errorInfo.context}
                        </div>
                      )}
                      {errorInfo.details && (
                        <div>
                          <Text strong>Details:</Text>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                            {JSON.stringify(errorInfo.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </Collapse>
            )}
          </div>
        }
        type={getErrorType(errorInfo.code) as any}
        showIcon
        icon={<ExclamationCircleOutlined />}
        className="error-display"
      />
    </div>
  );
};

// Inline error component for forms and inputs
export const InlineError: React.FC<{
  error: string | null;
  className?: string;
}> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`text-red-500 text-sm mt-1 ${className}`}>
      <ExclamationCircleOutlined className="mr-1" />
      {error}
    </div>
  );
};

// Error boundary fallback component
export const ErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <div className="text-center space-y-4">
          <div className="text-6xl">😵</div>
          <div>
            <Text strong className="text-lg">
              Oops! Something went wrong
            </Text>
            <Paragraph className="text-gray-600 mt-2">
              The application encountered an unexpected error. This has been logged
              and we'll look into it.
            </Paragraph>
          </div>
          
          <Space direction="vertical" className="w-full">
            <Button type="primary" onClick={resetError} block>
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} block>
              Reload Page
            </Button>
          </Space>

          {process.env.NODE_ENV === 'development' && (
            <Collapse size="small">
              <Panel header="Error Details (Development)" key="error">
                <pre className="text-left text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {error.stack}
                </pre>
              </Panel>
            </Collapse>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
