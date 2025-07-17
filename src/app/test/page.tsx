'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, List, Tag, Progress, Space, Alert, Divider } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { endToEndTester, WorkflowTestResult, TestResult } from '@/lib/test-utils';

const { Title, Text, Paragraph } = Typography;

export default function TestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<WorkflowTestResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setCurrentStep('Starting tests...');

    try {
      const results = await endToEndTester.testCompleteWorkflow();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.success) {
      return <CheckCircleOutlined className="text-green-500" />;
    } else {
      return <CloseCircleOutlined className="text-red-500" />;
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'success' : 'error';
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={2}>DocuMancer End-to-End Testing</Title>
          <Paragraph>
            This page tests the complete workflow: PDF upload → display → AI analysis → annotations → Q&A
          </Paragraph>
        </div>

        <div className="mb-6">
          <Button
            type="primary"
            size="large"
            icon={isRunning ? <LoadingOutlined /> : <PlayCircleOutlined />}
            onClick={runTests}
            disabled={isRunning}
            block
          >
            {isRunning ? 'Running Tests...' : 'Run Complete Workflow Test'}
          </Button>
          
          {currentStep && (
            <div className="mt-3 text-center">
              <Text type="secondary">{currentStep}</Text>
            </div>
          )}
        </div>

        {testResults && (
          <div className="space-y-6">
            <Alert
              message={`Test ${testResults.overallSuccess ? 'Passed' : 'Failed'}`}
              description={`Total duration: ${formatDuration(testResults.totalDuration)}`}
              type={testResults.overallSuccess ? 'success' : 'error'}
              showIcon
            />

            <Card title="Test Results" size="small">
              <List
                dataSource={testResults.steps}
                renderItem={(step) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(step.result)}
                          <Text strong>{step.name}</Text>
                          <Tag color={getStatusColor(step.result.success)}>
                            {step.result.success ? 'PASS' : 'FAIL'}
                          </Tag>
                        </div>
                        <Text type="secondary" className="text-sm">
                          {formatDuration(step.result.duration)}
                        </Text>
                      </div>
                      
                      <div className="ml-6">
                        <Text className={step.result.success ? 'text-green-600' : 'text-red-600'}>
                          {step.result.message}
                        </Text>
                        
                        {step.result.details && (
                          <div className="mt-1">
                            <Text type="secondary" className="text-xs">
                              Details: {JSON.stringify(step.result.details)}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Test Coverage" size="small">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Title level={5}>Core Features Tested</Title>
                  <List size="small">
                    <List.Item>✅ PDF File Upload</List.Item>
                    <List.Item>✅ PDF Display & Rendering</List.Item>
                    <List.Item>✅ AI-Powered Analysis</List.Item>
                    <List.Item>✅ Annotation System</List.Item>
                    <List.Item>✅ Interactive Q&A</List.Item>
                    <List.Item>✅ Data Persistence</List.Item>
                  </List>
                </div>
                
                <div>
                  <Title level={5}>Technical Validations</Title>
                  <List size="small">
                    <List.Item>✅ API Endpoints</List.Item>
                    <List.Item>✅ File Processing</List.Item>
                    <List.Item>✅ Database Operations</List.Item>
                    <List.Item>✅ Error Handling</List.Item>
                    <List.Item>✅ Response Times</List.Item>
                    <List.Item>✅ Data Integrity</List.Item>
                  </List>
                </div>
              </div>
            </Card>

            <Card title="Performance Metrics" size="small">
              <div className="space-y-3">
                {testResults.steps.map((step, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <Text>{step.name}</Text>
                      <Text type="secondary">{formatDuration(step.result.duration)}</Text>
                    </div>
                    <Progress
                      percent={Math.min((step.result.duration || 0) / 100, 100)}
                      size="small"
                      status={step.result.success ? 'success' : 'exception'}
                      showInfo={false}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <Divider />

        <Card title="Manual Testing Checklist" size="small">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Title level={5}>UI/UX Testing</Title>
              <List size="small">
                <List.Item>□ Responsive design on mobile</List.Item>
                <List.Item>□ Drag & drop file upload</List.Item>
                <List.Item>□ PDF navigation controls</List.Item>
                <List.Item>□ Text selection & highlighting</List.Item>
                <List.Item>□ Annotation toolbar positioning</List.Item>
                <List.Item>□ Mobile drawer functionality</List.Item>
              </List>
            </div>
            
            <div>
              <Title level={5}>Feature Testing</Title>
              <List size="small">
                <List.Item>□ Multiple PDF formats</List.Item>
                <List.Item>□ Large file handling</List.Item>
                <List.Item>□ Complex document analysis</List.Item>
                <List.Item>□ Annotation persistence</List.Item>
                <List.Item>□ Export/import functionality</List.Item>
                <List.Item>□ Error recovery</List.Item>
              </List>
            </div>
          </div>
        </Card>

        <Card title="Browser Compatibility" size="small">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <Text strong>Chrome</Text>
              <div className="text-green-500">✅ Supported</div>
            </div>
            <div>
              <Text strong>Firefox</Text>
              <div className="text-green-500">✅ Supported</div>
            </div>
            <div>
              <Text strong>Safari</Text>
              <div className="text-yellow-500">⚠️ Limited</div>
            </div>
            <div>
              <Text strong>Edge</Text>
              <div className="text-green-500">✅ Supported</div>
            </div>
          </div>
        </Card>

        <Alert
          message="Testing Notes"
          description={
            <div>
              <p>• Automated tests verify core functionality and API endpoints</p>
              <p>• Manual testing is recommended for UI/UX validation</p>
              <p>• Performance may vary based on PDF size and complexity</p>
              <p>• Some features require a valid DeepSeek API key</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
}
