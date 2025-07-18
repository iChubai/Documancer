'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Button, 
  List, 
  Avatar,
  Tabs,
  Tag,
  Progress,
  Input,
  Select,
  Badge,
  Tooltip,
  Modal,
  Form,
  message,
  Empty,
  Divider
} from 'antd';
import { 
  ExperimentOutlined, 
  PlusOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  BulbOutlined,
  RocketOutlined,
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Experiment {
  id: string;
  title: string;
  description: string;
  hypothesis: string;
  methodology: string;
  status: 'planning' | 'running' | 'paused' | 'completed';
  progress: number;
  startDate: Date;
  estimatedCompletion: Date;
  tags: string[];
  collaborators: string[];
  results?: string;
  papers: number;
}

interface ExperimentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'literature_review' | 'data_analysis' | 'comparison' | 'meta_analysis';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: string[];
}

export default function ResearchLab() {
  const [activeTab, setActiveTab] = useState('experiments');
  const [newExperimentModalVisible, setNewExperimentModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const [experiments] = useState<Experiment[]>([
    {
      id: '1',
      title: 'Comparative Analysis of Transformer Architectures',
      description: 'A systematic comparison of different transformer variants (BERT, GPT, T5) across various NLP tasks',
      hypothesis: 'Different transformer architectures will show varying performance patterns across specific task types',
      methodology: 'Controlled comparison using standardized datasets and evaluation metrics',
      status: 'running',
      progress: 65,
      startDate: new Date('2024-01-10'),
      estimatedCompletion: new Date('2024-02-15'),
      tags: ['transformers', 'NLP', 'comparison'],
      collaborators: ['Dr. Sarah Chen', 'Prof. Michael Brown'],
      papers: 15
    },
    {
      id: '2',
      title: 'Evolution of Computer Vision Techniques',
      description: 'Tracking the development of computer vision methods from traditional approaches to modern deep learning',
      hypothesis: 'Modern deep learning methods show significant improvements over traditional approaches in accuracy and efficiency',
      methodology: 'Historical analysis with performance benchmarking',
      status: 'completed',
      progress: 100,
      startDate: new Date('2023-12-01'),
      estimatedCompletion: new Date('2024-01-30'),
      tags: ['computer vision', 'deep learning', 'history'],
      collaborators: ['Dr. Emily Johnson'],
      results: 'Confirmed hypothesis with 40% average improvement in accuracy and 60% reduction in processing time',
      papers: 28
    },
    {
      id: '3',
      title: 'Meta-Analysis of Reinforcement Learning in Robotics',
      description: 'Comprehensive review of RL applications in robotics with performance analysis',
      hypothesis: 'RL methods show consistent patterns of success in specific robotic task categories',
      methodology: 'Meta-analysis with statistical significance testing',
      status: 'planning',
      progress: 15,
      startDate: new Date('2024-01-20'),
      estimatedCompletion: new Date('2024-03-30'),
      tags: ['reinforcement learning', 'robotics', 'meta-analysis'],
      collaborators: ['Lisa Wang', 'Alex Kim'],
      papers: 8
    }
  ]);

  const [templates] = useState<ExperimentTemplate[]>([
    {
      id: '1',
      name: 'Systematic Literature Review',
      description: 'Comprehensive analysis of literature on a specific topic with synthesis of findings',
      category: 'literature_review',
      difficulty: 'intermediate',
      estimatedTime: '4-6 weeks',
      steps: [
        'Define research question and scope',
        'Develop search strategy',
        'Screen and select papers',
        'Extract data and analyze',
        'Synthesize findings and conclusions'
      ]
    },
    {
      id: '2',
      name: 'Comparative Performance Analysis',
      description: 'Side-by-side comparison of different methods or approaches',
      category: 'comparison',
      difficulty: 'beginner',
      estimatedTime: '2-3 weeks',
      steps: [
        'Select methods to compare',
        'Define evaluation criteria',
        'Collect performance data',
        'Statistical analysis',
        'Draw conclusions'
      ]
    },
    {
      id: '3',
      name: 'Data-Driven Insights',
      description: 'Extract insights from research data using statistical analysis',
      category: 'data_analysis',
      difficulty: 'advanced',
      estimatedTime: '3-4 weeks',
      steps: [
        'Data collection and cleaning',
        'Exploratory data analysis',
        'Statistical modeling',
        'Validation and testing',
        'Report findings'
      ]
    },
    {
      id: '4',
      name: 'Meta-Analysis Framework',
      description: 'Combine results from multiple studies for comprehensive analysis',
      category: 'meta_analysis',
      difficulty: 'advanced',
      estimatedTime: '6-8 weeks',
      steps: [
        'Study selection criteria',
        'Data extraction protocol',
        'Quality assessment',
        'Statistical meta-analysis',
        'Interpretation and reporting'
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'blue';
      case 'running': return 'green';
      case 'paused': return 'orange';
      case 'completed': return 'purple';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <ClockCircleOutlined />;
      case 'running': return <PlayCircleOutlined />;
      case 'paused': return <PauseCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      default: return <ExperimentOutlined />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'literature_review': return <FileTextOutlined />;
      case 'data_analysis': return <ThunderboltOutlined />;
      case 'comparison': return <FilterOutlined />;
      case 'meta_analysis': return <SearchOutlined />;
      default: return <ExperimentOutlined />;
    }
  };

  const handleStartExperiment = (id: string) => {
    message.success('Experiment started!');
  };

  const handlePauseExperiment = (id: string) => {
    message.info('Experiment paused');
  };

  const handleCompleteExperiment = (id: string) => {
    message.success('Experiment completed!');
  };

  const experimentsTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={5}>
          <ExperimentOutlined className="mr-2 text-blue-600" />
          My Experiments
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setNewExperimentModalVisible(true)}
        >
          New Experiment
        </Button>
      </div>

      <div className="space-y-3">
        {experiments.map((experiment) => (
          <Card key={experiment.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(experiment.status)}
                    <Text strong>{experiment.title}</Text>
                    <Tag color={getStatusColor(experiment.status)}>
                      {experiment.status}
                    </Tag>
                  </div>
                  
                  <Paragraph className="text-sm text-gray-600 mb-2">
                    {experiment.description}
                  </Paragraph>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{experiment.papers} papers</span>
                    <span>{experiment.collaborators.length} collaborators</span>
                    <span>Started: {experiment.startDate.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {experiment.status === 'planning' && (
                    <Button 
                      size="small" 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleStartExperiment(experiment.id)}
                    >
                      Start
                    </Button>
                  )}
                  {experiment.status === 'running' && (
                    <Button 
                      size="small" 
                      icon={<PauseCircleOutlined />}
                      onClick={() => handlePauseExperiment(experiment.id)}
                    >
                      Pause
                    </Button>
                  )}
                  <Button size="small" icon={<SettingOutlined />} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text type="secondary" className="text-xs">Progress</Text>
                  <Text type="secondary" className="text-xs">
                    {experiment.progress}% complete
                  </Text>
                </div>
                <Progress 
                  percent={experiment.progress} 
                  size="small"
                  status={experiment.status === 'completed' ? 'success' : 'active'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Space>
                  {experiment.tags.map(tag => (
                    <Tag key={tag} size="small" color="blue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
                <Text type="secondary" className="text-xs">
                  Due: {experiment.estimatedCompletion.toLocaleDateString()}
                </Text>
              </div>
              
              {experiment.results && (
                <div className="mt-2 p-2 bg-green-50 rounded">
                  <Text className="text-xs font-medium text-green-800">Results:</Text>
                  <Text className="text-xs text-green-700 block mt-1">
                    {experiment.results}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const templatesTab = (
    <div className="space-y-4">
      <Title level={5}>
        <RocketOutlined className="mr-2 text-green-600" />
        Experiment Templates
      </Title>
      
      <div className="space-y-3">
        {templates.map((template) => (
          <Card key={template.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getCategoryIcon(template.category)}
                    <Text strong>{template.name}</Text>
                    <Tag color={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Tag>
                  </div>
                  
                  <Paragraph className="text-sm text-gray-600 mb-2">
                    {template.description}
                  </Paragraph>
                  
                  <Text type="secondary" className="text-xs">
                    Estimated time: {template.estimatedTime}
                  </Text>
                </div>
                
                <Button 
                  size="small" 
                  type="primary"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setNewExperimentModalVisible(true);
                  }}
                >
                  Use Template
                </Button>
              </div>
              
              <div>
                <Text className="text-xs font-medium text-gray-700 mb-2 block">Steps:</Text>
                <div className="space-y-1">
                  {template.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Badge count={index + 1} size="small" />
                      <Text className="text-xs text-gray-600">{step}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const insightsTab = (
    <div className="space-y-4">
      <Title level={5}>
        <BulbOutlined className="mr-2 text-orange-600" />
        Research Insights
      </Title>
      
      <div className="space-y-3">
        <Card size="small" className="bg-blue-50">
          <div className="flex items-center space-x-3">
            <ThunderboltOutlined className="text-blue-500 text-lg" />
            <div>
              <Text strong className="text-sm">Trending Research Areas</Text>
              <Text className="text-xs text-gray-600 block">
                Based on your experiments, consider exploring: Multimodal AI, Federated Learning, Explainable AI
              </Text>
            </div>
          </div>
        </Card>
        
        <Card size="small" className="bg-green-50">
          <div className="flex items-center space-x-3">
            <StarOutlined className="text-green-500 text-lg" />
            <div>
              <Text strong className="text-sm">Collaboration Opportunities</Text>
              <Text className="text-xs text-gray-600 block">
                3 researchers in your network are working on similar topics. Consider reaching out for collaboration.
              </Text>
            </div>
          </div>
        </Card>
        
        <Card size="small" className="bg-purple-50">
          <div className="flex items-center space-x-3">
            <RocketOutlined className="text-purple-500 text-lg" />
            <div>
              <Text strong className="text-sm">Productivity Tip</Text>
              <Text className="text-xs text-gray-600 block">
                Your experiment completion rate increases by 40% when you set intermediate milestones.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <Card 
        title={
          <Space>
            <ExperimentOutlined className="text-blue-600" />
            <span className="font-semibold">Research Lab</span>
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
              key: 'experiments',
              label: (
                <Space>
                  <ExperimentOutlined />
                  Experiments
                </Space>
              ),
              children: experimentsTab
            },
            {
              key: 'templates',
              label: (
                <Space>
                  <RocketOutlined />
                  Templates
                </Space>
              ),
              children: templatesTab
            },
            {
              key: 'insights',
              label: (
                <Space>
                  <BulbOutlined />
                  Insights
                </Space>
              ),
              children: insightsTab
            }
          ]}
        />
      </Card>

      {/* New Experiment Modal */}
      <Modal
        title="Create New Experiment"
        open={newExperimentModalVisible}
        onCancel={() => {
          setNewExperimentModalVisible(false);
          setSelectedTemplate(null);
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Experiment Title">
            <Input placeholder="Enter experiment title" />
          </Form.Item>
          
          <Form.Item label="Research Question">
            <TextArea placeholder="What research question are you trying to answer?" />
          </Form.Item>
          
          <Form.Item label="Hypothesis">
            <TextArea placeholder="State your hypothesis" />
          </Form.Item>
          
          <Form.Item label="Category">
            <Select placeholder="Select experiment category">
              <Option value="literature_review">Literature Review</Option>
              <Option value="data_analysis">Data Analysis</Option>
              <Option value="comparison">Comparison Study</Option>
              <Option value="meta_analysis">Meta-Analysis</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Collaborators">
            <Select mode="multiple" placeholder="Add collaborators">
              <Option value="sarah">Dr. Sarah Chen</Option>
              <Option value="michael">Prof. Michael Brown</Option>
              <Option value="lisa">Lisa Wang</Option>
              <Option value="alex">Alex Kim</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" block icon={<PlusOutlined />}>
              Create Experiment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
