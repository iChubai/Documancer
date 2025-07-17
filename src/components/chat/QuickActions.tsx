'use client';

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Modal, Spin } from 'antd';
import {
  FileTextOutlined,
  BulbOutlined,
  ExperimentOutlined,
  BookOutlined,
  LinkOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Paper } from '@/lib/types';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { ANALYSIS_TYPES } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;

interface QuickActionsProps {
  paper: Paper;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  paper,
  className = '',
}) => {
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  
  const { analyzeDocument, isAnalyzing } = useAIAnalysis();

  const handleQuickAnalysis = async (type: string, title: string) => {
    setAnalysisType(title);
    setModalVisible(true);
    setAnalysisResult('');

    const result = await analyzeDocument(paper, type);
    if (result) {
      setAnalysisResult(result);
    }
  };

  const quickActions = [
    {
      key: ANALYSIS_TYPES.SUMMARY,
      title: 'Summarize',
      description: 'Get a comprehensive summary',
      icon: <FileTextOutlined />,
      color: '#1890ff',
    },
    {
      key: ANALYSIS_TYPES.KEY_FINDINGS,
      title: 'Key Findings',
      description: 'Extract main discoveries',
      icon: <BulbOutlined />,
      color: '#52c41a',
    },
    {
      key: ANALYSIS_TYPES.METHODOLOGY,
      title: 'Methodology',
      description: 'Explain research methods',
      icon: <ExperimentOutlined />,
      color: '#722ed1',
    },
    {
      key: ANALYSIS_TYPES.CONCEPTS,
      title: 'Key Concepts',
      description: 'Define important terms',
      icon: <BookOutlined />,
      color: '#fa8c16',
    },
    {
      key: ANALYSIS_TYPES.CITATIONS,
      title: 'Citations',
      description: 'Analyze references',
      icon: <LinkOutlined />,
      color: '#eb2f96',
    },
  ];

  return (
    <>
      <Card 
        title="Quick Analysis" 
        className={className}
        extra={
          <Text type="secondary" className="text-sm">
            AI-powered insights
          </Text>
        }
      >
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Button
              key={action.key}
              block
              size="large"
              className="text-left h-auto py-3"
              onClick={() => handleQuickAnalysis(action.key, action.title)}
              loading={isAnalyzing && analysisType === action.title}
              disabled={isAnalyzing}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded"
                  style={{ backgroundColor: `${action.color}20`, color: action.color }}
                >
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <Divider />

        <div className="text-center">
          <Text type="secondary" className="text-sm">
            Or ask specific questions in the chat above
          </Text>
        </div>
      </Card>

      {/* Analysis Result Modal */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            {analysisType} - {paper.title}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
        className="analysis-modal"
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
            <Text className="ml-3">Analyzing paper...</Text>
          </div>
        ) : analysisResult ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{analysisResult}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-8">
            <Text type="secondary">No analysis result available</Text>
          </div>
        )}
      </Modal>
    </>
  );
};

export default QuickActions;
