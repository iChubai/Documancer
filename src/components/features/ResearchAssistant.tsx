'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Typography, 
  Space, 
  Avatar, 
  Tabs, 
  Tag,
  Tooltip,
  message,
  Divider,
  Badge,
  Empty
} from 'antd';
import { 
  RobotOutlined, 
  SendOutlined, 
  BulbOutlined, 
  SearchOutlined,
  BookOutlined,
  HistoryOutlined,
  StarOutlined,
  MessageOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  UserOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ResearchQuery {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  tags: string[];
  liked: boolean;
}

interface ResearchSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'methodology' | 'literature' | 'analysis' | 'writing';
  priority: 'high' | 'medium' | 'low';
}

export default function ResearchAssistant() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useState<ResearchQuery[]>([
    {
      id: '1',
      question: 'How do I conduct a systematic literature review?',
      answer: 'A systematic literature review involves several key steps: 1) Define your research question using PICO framework, 2) Develop search strategies with relevant keywords, 3) Set inclusion/exclusion criteria, 4) Search multiple databases, 5) Screen articles systematically, 6) Extract and analyze data, 7) Synthesize findings and assess quality.',
      timestamp: new Date('2024-01-15'),
      tags: ['methodology', 'literature review'],
      liked: true
    },
    {
      id: '2',
      question: 'What are the best practices for academic writing?',
      answer: 'Key academic writing best practices include: 1) Clear thesis statement, 2) Logical structure with transitions, 3) Evidence-based arguments, 4) Proper citations, 5) Formal tone and style, 6) Proofreading and editing, 7) Following journal guidelines.',
      timestamp: new Date('2024-01-14'),
      tags: ['writing', 'academic'],
      liked: false
    }
  ]);

  const [suggestions] = useState<ResearchSuggestion[]>([
    {
      id: '1',
      title: 'Set up research methodology framework',
      description: 'Define your research questions, hypotheses, and methodology before diving into literature review.',
      category: 'methodology',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Create citation management system',
      description: 'Organize your references using tools like Zotero or Mendeley for efficient citation management.',
      category: 'literature',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Develop data analysis plan',
      description: 'Plan your statistical analysis methods and tools before collecting data.',
      category: 'analysis',
      priority: 'high'
    },
    {
      id: '4',
      title: 'Start writing early drafts',
      description: 'Begin writing sections early to identify gaps and refine your arguments.',
      category: 'writing',
      priority: 'medium'
    }
  ]);

  const handleSubmit = async () => {
    if (!query.trim()) {
      message.warning('Please enter a research question');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/research-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get research assistance');
      }

      const data = await response.json();
      
      if (data.success) {
        const newQuery: ResearchQuery = {
          id: Date.now().toString(),
          question: query,
          answer: data.answer,
          timestamp: new Date(),
          tags: data.tags || ['research', 'ai-generated'],
          liked: false
        };
        
        setChatHistory([newQuery, ...chatHistory]);
        setQuery('');
        message.success('Research assistant has provided insights!');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Research Assistant error:', error);
      message.error('Failed to get research assistance: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (id: string) => {
    setChatHistory(chatHistory.map(item => 
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'methodology': return 'blue';
      case 'literature': return 'green';
      case 'analysis': return 'orange';
      case 'writing': return 'purple';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'gray';
      default: return 'default';
    }
  };

  const chatTab = (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <Title level={5} className="text-center mb-3">
          <RobotOutlined className="mr-2 text-blue-600" />
          Ask Your Research Assistant
        </Title>
        
        <div className="space-y-3">
          <TextArea
            placeholder="Ask about research methodology, literature review, data analysis, or any academic question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="resize-none"
          />
          
          <Button
            type="primary"
            block
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!query.trim()}
            className="h-10 font-medium"
          >
            Get Research Insights
          </Button>
        </div>
      </div>

      <Divider orientation="left">
        <Space>
          <HistoryOutlined />
          <span>Chat History</span>
          <Badge count={chatHistory.length} />
        </Space>
      </Divider>

      {chatHistory.length === 0 ? (
        <Empty description="No chat history yet" />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {chatHistory.map((item) => (
            <Card key={item.id} size="small" className="shadow-sm">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <div className="flex-1">
                    <Text strong>{item.question}</Text>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Avatar size="small" icon={<RobotOutlined />} className="bg-blue-500" />
                  <div className="flex-1">
                    <Paragraph className="text-sm text-gray-700 mb-2">
                      {item.answer}
                    </Paragraph>
                    
                    <div className="flex items-center justify-between">
                      <Space>
                        {item.tags.map(tag => (
                          <Tag key={tag} size="small" color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                      
                      <Button
                        type="text"
                        size="small"
                        icon={<StarOutlined />}
                        onClick={() => toggleLike(item.id)}
                        className={item.liked ? 'text-yellow-500' : 'text-gray-400'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const suggestionsTab = (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <Title level={5}>
          <BulbOutlined className="mr-2 text-yellow-600" />
          Smart Research Suggestions
        </Title>
        <Text type="secondary">
          Personalized recommendations to improve your research workflow
        </Text>
      </div>

      <List
        dataSource={suggestions}
        renderItem={(item) => (
          <List.Item className="hover:bg-gray-50 rounded-lg p-3">
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={
                    item.category === 'methodology' ? <ExperimentOutlined /> :
                    item.category === 'literature' ? <BookOutlined /> :
                    item.category === 'analysis' ? <ThunderboltOutlined /> :
                    <MessageOutlined />
                  }
                  className={`bg-${getCategoryColor(item.category)}-500`}
                />
              }
              title={
                <div className="flex items-center justify-between">
                  <Text strong>{item.title}</Text>
                  <Space>
                    <Tag color={getCategoryColor(item.category)}>
                      {item.category}
                    </Tag>
                    <Tag color={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Tag>
                  </Space>
                </div>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <div className="h-full">
      <Card 
        title={
          <Space>
            <RobotOutlined className="text-blue-600" />
            <span className="font-semibold">Research Assistant</span>
          </Space>
        }
        size="small"
        className="h-full shadow-lg border-0"
        headStyle={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: '8px 8px 0 0' 
        }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'chat',
              label: (
                <Space>
                  <MessageOutlined />
                  Chat
                </Space>
              ),
              children: chatTab
            },
            {
              key: 'suggestions',
              label: (
                <Space>
                  <BulbOutlined />
                  Suggestions
                </Space>
              ),
              children: suggestionsTab
            }
          ]}
        />
      </Card>
    </div>
  );
}
