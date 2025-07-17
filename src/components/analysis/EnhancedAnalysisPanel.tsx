'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Typography, Spin, Alert, Collapse, List, Tag, Input, Divider } from 'antd';
import { 
  AnalysisOutlined, 
  BulbOutlined, 
  QuestionCircleOutlined, 
  FileTextOutlined,
  StarOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Paper } from '@/lib/types';
import { useEnhancedAnalysis } from '@/hooks/useEnhancedAnalysis';
import { ComprehensiveAnalysis, ConceptExtraction } from '@/lib/ai-analysis-service';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

interface EnhancedAnalysisPanelProps {
  paper: Paper;
  className?: string;
}

const EnhancedAnalysisPanel: React.FC<EnhancedAnalysisPanelProps> = ({
  paper,
  className = '',
}) => {
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [concepts, setConcepts] = useState<ConceptExtraction[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    isAnalyzing,
    error,
    analyzeDocument,
    extractConcepts,
    generateQuestions,
    askQuestion,
    clearError,
  } = useEnhancedAnalysis();

  useEffect(() => {
    if (paper.content) {
      performInitialAnalysis();
    }
  }, [paper.id]);

  const performInitialAnalysis = async () => {
    if (!paper.content) return;

    try {
      // Run comprehensive analysis
      const analysisResult = await analyzeDocument(paper.content);
      if (analysisResult) {
        setAnalysis(analysisResult);
      }

      // Extract concepts
      const conceptsResult = await extractConcepts(paper.content);
      setConcepts(conceptsResult);

      // Generate questions
      const questionsResult = await generateQuestions(paper.content);
      setQuestions(questionsResult);

    } catch (error) {
      console.error('Error in initial analysis:', error);
    }
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim() || !paper.content) return;

    const result = await askQuestion(paper.content, userQuestion);
    if (result) {
      setChatHistory(prev => [...prev, {
        question: userQuestion,
        answer: result.answer,
      }]);
      setUserQuestion('');
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;

    const exportData = {
      paper: {
        title: paper.title,
        authors: paper.authors,
        id: paper.id,
      },
      analysis,
      concepts,
      questions,
      chatHistory,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title}_analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <AnalysisOutlined />
          Overview
        </span>
      ),
      children: (
        <div className="space-y-4">
          {analysis ? (
            <>
              <Card title="Executive Summary" size="small">
                <Paragraph>{analysis.summary}</Paragraph>
              </Card>

              <Card title="Key Findings" size="small">
                <List
                  dataSource={analysis.keyFindings}
                  renderItem={(finding, index) => (
                    <List.Item>
                      <Text strong>{index + 1}.</Text> {finding}
                    </List.Item>
                  )}
                />
              </Card>

              <Card title="Main Contributions" size="small">
                <List
                  dataSource={analysis.mainContributions}
                  renderItem={(contribution, index) => (
                    <List.Item>
                      <Text strong>{index + 1}.</Text> {contribution}
                    </List.Item>
                  )}
                />
              </Card>

              <Collapse>
                <Panel header="Critical Analysis" key="critical">
                  <div className="space-y-3">
                    <div>
                      <Text strong className="text-green-600">Strengths:</Text>
                      <List
                        size="small"
                        dataSource={analysis.criticalAnalysis.strengths}
                        renderItem={item => <List.Item>• {item}</List.Item>}
                      />
                    </div>
                    <div>
                      <Text strong className="text-red-600">Weaknesses:</Text>
                      <List
                        size="small"
                        dataSource={analysis.criticalAnalysis.weaknesses}
                        renderItem={item => <List.Item>• {item}</List.Item>}
                      />
                    </div>
                    <div>
                      <Text strong className="text-blue-600">Implications:</Text>
                      <List
                        size="small"
                        dataSource={analysis.criticalAnalysis.implications}
                        renderItem={item => <List.Item>• {item}</List.Item>}
                      />
                    </div>
                  </div>
                </Panel>
                <Panel header="Technical Details" key="technical">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text strong>Algorithms:</Text>
                      <div className="mt-2">
                        {analysis.technicalDetails.algorithms.map((alg, idx) => (
                          <Tag key={idx} className="mb-1">{alg}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text strong>Datasets:</Text>
                      <div className="mt-2">
                        {analysis.technicalDetails.datasets.map((dataset, idx) => (
                          <Tag key={idx} className="mb-1" color="blue">{dataset}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text strong>Metrics:</Text>
                      <div className="mt-2">
                        {analysis.technicalDetails.metrics.map((metric, idx) => (
                          <Tag key={idx} className="mb-1" color="green">{metric}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text strong>Tools:</Text>
                      <div className="mt-2">
                        {analysis.technicalDetails.tools.map((tool, idx) => (
                          <Tag key={idx} className="mb-1" color="orange">{tool}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </>
          ) : (
            <div className="text-center py-8">
              <Text type="secondary">No analysis available. Click "Analyze" to start.</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'concepts',
      label: (
        <span>
          <BulbOutlined />
          Concepts ({concepts.length})
        </span>
      ),
      children: (
        <div className="space-y-4">
          <List
            dataSource={concepts}
            renderItem={(concept) => (
              <List.Item>
                <div className="w-full">
                  <div className="flex justify-between items-start mb-2">
                    <Text strong className="text-lg">{concept.term}</Text>
                    <Tag color={
                      concept.importance === 'high' ? 'red' :
                      concept.importance === 'medium' ? 'orange' : 'default'
                    }>
                      {concept.importance}
                    </Tag>
                  </div>
                  <Paragraph className="mb-2">{concept.definition}</Paragraph>
                  {concept.relatedTerms.length > 0 && (
                    <div>
                      <Text type="secondary">Related: </Text>
                      {concept.relatedTerms.map((term, idx) => (
                        <Tag key={idx} size="small">{term}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: 'questions',
      label: (
        <span>
          <QuestionCircleOutlined />
          Q&A
        </span>
      ),
      children: (
        <div className="space-y-4">
          {/* Generated Questions */}
          <Card title="Suggested Questions" size="small">
            <List
              dataSource={questions}
              renderItem={(question) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => setUserQuestion(question)}
                    >
                      Ask
                    </Button>
                  ]}
                >
                  {question}
                </List.Item>
              )}
            />
          </Card>

          {/* Ask Question */}
          <Card title="Ask a Question" size="small">
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                placeholder="Ask anything about this paper..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                rows={2}
              />
              <Button 
                type="primary" 
                onClick={handleAskQuestion}
                loading={isAnalyzing}
                disabled={!userQuestion.trim()}
              >
                Ask
              </Button>
            </Space.Compact>
          </Card>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <Card title="Chat History" size="small">
              <div className="space-y-4">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0">
                    <div className="mb-2">
                      <Text strong className="text-blue-600">Q: </Text>
                      <Text>{chat.question}</Text>
                    </div>
                    <div>
                      <Text strong className="text-green-600">A: </Text>
                      <Paragraph>{chat.answer}</Paragraph>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={`enhanced-analysis-panel ${className}`}>
      <Card
        title={
          <div className="flex justify-between items-center">
            <Title level={4} className="mb-0">AI Analysis</Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={performInitialAnalysis}
                loading={isAnalyzing}
                size="small"
              >
                Analyze
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportAnalysis}
                disabled={!analysis}
                size="small"
              >
                Export
              </Button>
            </Space>
          </div>
        }
        className="h-full"
      >
        {error && (
          <Alert
            message="Analysis Error"
            description={error}
            type="error"
            closable
            onClose={clearError}
            className="mb-4"
          />
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-2">
              <Text>Analyzing document with AI...</Text>
            </div>
          </div>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="h-full"
        />
      </Card>
    </div>
  );
};

export default EnhancedAnalysisPanel;
