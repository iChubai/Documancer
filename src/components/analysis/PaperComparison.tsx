'use client';

import React, { useState } from 'react';
import { Card, Select, Button, Typography, Divider, Space, Tag, Spin, Empty } from 'antd';
import {
  SwapOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { Paper, ComparisonResult } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface PaperComparisonProps {
  className?: string;
}

const PaperComparison: React.FC<PaperComparisonProps> = ({
  className = '',
}) => {
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  
  const { papers } = useAppStore();
  const { comparePapers } = useAIAnalysis();

  const handlePaperSelect = (paperId: string, index: number) => {
    const newSelection = [...selectedPapers];
    newSelection[index] = paperId;
    setSelectedPapers(newSelection);
  };

  const handleSwapPapers = () => {
    if (selectedPapers.length >= 2) {
      setSelectedPapers([selectedPapers[1], selectedPapers[0]]);
    }
  };

  const handleCompare = async () => {
    if (selectedPapers.length < 2) return;

    const paper1 = papers.find(p => p.id === selectedPapers[0]);
    const paper2 = papers.find(p => p.id === selectedPapers[1]);

    if (!paper1 || !paper2) return;

    setIsComparing(true);
    try {
      const result = await comparePapers([paper1, paper2]);
      if (result) {
        setComparisonResult(result);
      }
    } catch (error) {
      console.error('Error comparing papers:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const clearComparison = () => {
    setSelectedPapers([]);
    setComparisonResult('');
  };

  const getPaperOptions = (excludeId?: string) => {
    return papers
      .filter(paper => paper.id !== excludeId)
      .map(paper => (
        <Option key={paper.id} value={paper.id}>
          <div className="flex items-center space-x-2">
            <FileTextOutlined />
            <span className="truncate">{paper.title}</span>
          </div>
        </Option>
      ));
  };

  const getSelectedPaper = (index: number): Paper | undefined => {
    return papers.find(p => p.id === selectedPapers[index]);
  };

  const PaperCard: React.FC<{ paper: Paper; index: number }> = ({ paper, index }) => (
    <Card size="small" className="h-full">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileTextOutlined className="text-blue-500" />
          <Text strong className="text-sm">Paper {index + 1}</Text>
        </div>
        
        <Title level={5} className="m-0 line-clamp-2">
          {paper.title}
        </Title>
        
        <Text type="secondary" className="text-xs">
          by {paper.authors.slice(0, 2).join(', ')}
          {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
        </Text>
        
        <Paragraph 
          className="text-xs text-gray-600 m-0"
          ellipsis={{ rows: 3 }}
        >
          {paper.abstract}
        </Paragraph>
        
        <div className="flex flex-wrap gap-1">
          {paper.tags.slice(0, 3).map(tag => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
          {paper.tags.length > 3 && (
            <Tag>+{paper.tags.length - 3}</Tag>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Paper Selection */}
      <Card title={
        <Space>
          <SwapOutlined />
          Compare Papers
        </Space>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paper 1 Selection */}
            <div>
              <Text strong className="block mb-2">Select First Paper</Text>
              <Select
                placeholder="Choose a paper..."
                className="w-full"
                value={selectedPapers[0]}
                onChange={(value) => handlePaperSelect(value, 0)}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.props?.children?.[1]?.props?.children
                    ?.toLowerCase()
                    ?.includes(input.toLowerCase()) ?? false
                }
              >
                {getPaperOptions(selectedPapers[1])}
              </Select>
            </div>

            {/* Paper 2 Selection */}
            <div>
              <Text strong className="block mb-2">Select Second Paper</Text>
              <Select
                placeholder="Choose a paper..."
                className="w-full"
                value={selectedPapers[1]}
                onChange={(value) => handlePaperSelect(value, 1)}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.props?.children?.[1]?.props?.children
                    ?.toLowerCase()
                    ?.includes(input.toLowerCase()) ?? false
                }
              >
                {getPaperOptions(selectedPapers[0])}
              </Select>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                icon={<SwapOutlined />}
                onClick={handleSwapPapers}
                disabled={selectedPapers.length < 2}
              >
                Swap
              </Button>
              <Button onClick={clearComparison}>
                Clear
              </Button>
            </div>
            
            <Button
              type="primary"
              icon={<CompareOutlined />}
              onClick={handleCompare}
              disabled={selectedPapers.length < 2}
              loading={isComparing}
            >
              Compare Papers
            </Button>
          </div>
        </div>
      </Card>

      {/* Selected Papers Preview */}
      {selectedPapers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedPapers.map((paperId, index) => {
            const paper = getSelectedPaper(index);
            return paper ? (
              <PaperCard key={paperId} paper={paper} index={index} />
            ) : (
              <Card key={index} size="small" className="h-full">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={`Select Paper ${index + 1}`}
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <Card 
          title={
            <Space>
              <BulbOutlined />
              Comparison Results
            </Space>
          }
          extra={
            <Button size="small" onClick={() => setComparisonResult('')}>
              Clear Results
            </Button>
          }
        >
          {isComparing ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <div className="mt-2">Analyzing and comparing papers...</div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{comparisonResult}</ReactMarkdown>
            </div>
          )}
        </Card>
      )}

      {/* Help Text */}
      {papers.length < 2 && (
        <Card>
          <Empty
            image={<CompareOutlined className="text-4xl text-gray-400" />}
            description="You need at least 2 papers to use the comparison feature"
          >
            <Text type="secondary">
              Upload more papers to your library to start comparing them.
            </Text>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default PaperComparison;
