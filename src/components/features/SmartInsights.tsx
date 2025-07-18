'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Progress, 
  Tag, 
  Button, 
  List, 
  Avatar,
  Tabs,
  Statistic,
  Alert,
  Tooltip,
  Badge
} from 'antd';
import { 
  ThunderboltOutlined, 
  RiseOutlined, 
  BulbOutlined, 
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  StarOutlined,
  BarChartOutlined,
  EyeOutlined,
  BookOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';

const { Title, Text } = Typography;

interface Insight {
  id: string;
  type: 'trend' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'reading' | 'research' | 'productivity' | 'collaboration';
  createdAt: Date;
}

interface TrendData {
  id: string;
  topic: string;
  papers: number;
  growth: number;
  keywords: string[];
  trending: boolean;
}

export default function SmartInsights() {
  const [activeTab, setActiveTab] = useState('insights');
  const { papers, chatMessages, annotations } = useAppStore();
  
  // Generate insights based on real data
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    // Analyze paper reading patterns
    if (papers.length > 0) {
      const recentPapers = papers.filter(p => 
        new Date(p.uploadedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      );
      
      if (recentPapers.length > 5) {
        insights.push({
          id: '1',
          type: 'achievement',
          title: 'Research Momentum Building',
          description: `You've added ${recentPapers.length} papers this month, showing strong research momentum. Keep up the excellent work!`,
          confidence: 95,
          impact: 'high',
          category: 'productivity',
          createdAt: new Date()
        });
      }
      
      // Analyze tag patterns
      const allTags = papers.flatMap(p => p.tags || []);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
      if (topTag && topTag[1] > 3) {
        insights.push({
          id: '2',
          type: 'trend',
          title: `Focus on ${topTag[0]} Research`,
          description: `You have ${topTag[1]} papers related to ${topTag[0]}. Consider exploring advanced topics or recent developments in this area.`,
          confidence: 88,
          impact: 'medium',
          category: 'research',
          createdAt: new Date()
        });
      }
    }
    
    // Analyze chat activity
    if (chatMessages.length > 0) {
      const recentMessages = chatMessages.filter(m => 
        new Date(m.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      
      if (recentMessages.length > 10) {
        insights.push({
          id: '3',
          type: 'recommendation',
          title: 'Active Learning Pattern',
          description: `You've been asking ${recentMessages.length} questions this week. Consider documenting key insights for future reference.`,
          confidence: 82,
          impact: 'medium',
          category: 'productivity',
          createdAt: new Date()
        });
      }
    }
    
    // Add default insights if no data
    if (insights.length === 0) {
      insights.push({
        id: 'default',
        type: 'recommendation',
        title: 'Start Your Research Journey',
        description: 'Upload your first paper to get personalized insights based on your reading patterns and research interests.',
        confidence: 100,
        impact: 'high',
        category: 'reading',
        createdAt: new Date()
      });
    }
    
    return insights;
  };
  
  const [insights] = useState<Insight[]>(generateInsights());

  // Generate trends based on real data
  const generateTrends = (): TrendData[] => {
    const trends: TrendData[] = [];
    
    if (papers.length > 0) {
      const allTags = papers.flatMap(p => p.tags || []);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
      
      sortedTags.forEach(([tag, count], index) => {
        trends.push({
          id: `trend_${index}`,
          topic: tag.charAt(0).toUpperCase() + tag.slice(1),
          papers: count,
          growth: Math.floor(Math.random() * 50) + 10, // Simulated growth
          keywords: [tag],
          trending: count > 2
        });
      });
    }
    
    // Add default trends if no data
    if (trends.length === 0) {
      trends.push({
        id: 'default',
        topic: 'Getting Started',
        papers: 0,
        growth: 0,
        keywords: ['research', 'papers'],
        trending: false
      });
    }
    
    return trends;
  };
  
  const [trends] = useState<TrendData[]>(generateTrends());

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <RiseOutlined className="text-blue-500" />;
      case 'recommendation': return <BulbOutlined className="text-green-500" />;
      case 'warning': return <WarningOutlined className="text-orange-500" />;
      case 'achievement': return <CheckCircleOutlined className="text-purple-500" />;
      default: return <ThunderboltOutlined />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'blue';
      case 'recommendation': return 'green';
      case 'warning': return 'orange';
      case 'achievement': return 'purple';
      default: return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const insightsTab = (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <Title level={5} className="text-center mb-3">
          <ThunderboltOutlined className="mr-2 text-blue-600" />
          AI-Powered Insights
        </Title>
        <Text type="secondary" className="text-center block text-sm">
          Personalized recommendations based on your reading patterns and research interests
        </Text>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <Text strong className="text-sm">{insight.title}</Text>
                  <Space>
                    <Tag color={getInsightColor(insight.type)} size="small">
                      {insight.type}
                    </Tag>
                    <Tag color={getImpactColor(insight.impact)} size="small">
                      {insight.impact}
                    </Tag>
                  </Space>
                </div>
                
                <Text type="secondary" className="text-sm block mb-2">
                  {insight.description}
                </Text>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Text type="secondary" className="text-xs">Confidence:</Text>
                    <Progress 
                      percent={insight.confidence} 
                      size="small" 
                      showInfo={false}
                      className="w-16"
                    />
                    <Text type="secondary" className="text-xs">{insight.confidence}%</Text>
                  </div>
                  <Text type="secondary" className="text-xs">
                    {insight.createdAt.toLocaleDateString()}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const trendsTab = (
    <div className="space-y-4">
      <Title level={5}>
        <RiseOutlined className="mr-2 text-green-600" />
        Research Trends
      </Title>
      
      <div className="grid grid-cols-1 gap-3">
        {trends.map((trend) => (
          <Card key={trend.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Text strong>{trend.topic}</Text>
                {trend.trending && (
                  <Badge dot>
                    <FireOutlined className="text-red-500" />
                  </Badge>
                )}
              </div>
              <Space>
                <Statistic
                  value={trend.growth}
                  precision={0}
                  valueStyle={{ fontSize: '14px', color: trend.growth > 30 ? '#52c41a' : '#1890ff' }}
                  prefix={<RiseOutlined />}
                  suffix="%"
                />
              </Space>
            </div>
            
            <div className="mb-3">
              <Text type="secondary" className="text-xs">Keywords:</Text>
              <div className="flex flex-wrap gap-1 mt-1">
                {trend.keywords.map((keyword) => (
                  <Tag key={keyword} size="small" color="blue">
                    {keyword}
                  </Tag>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Text type="secondary" className="text-xs">
                {trend.papers} papers
              </Text>
              <Button size="small" type="link">
                Explore →
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // Calculate real analytics
  const totalPapers = papers.length;
  const recentPapers = papers.filter(p => 
    new Date(p.uploadedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  const totalMessages = chatMessages.length;
  const recentMessages = chatMessages.filter(m => 
    new Date(m.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const analyticsTab = (
    <div className="space-y-4">
      <Title level={5}>
        <BarChartOutlined className="mr-2 text-orange-600" />
        Reading Analytics
      </Title>
      
      <div className="grid grid-cols-2 gap-4">
        <Card size="small" className="text-center">
          <Statistic
            title="Total Papers"
            value={totalPapers}
            valueStyle={{ color: '#3f8600' }}
            prefix={<BookOutlined />}
          />
        </Card>
        
        <Card size="small" className="text-center">
          <Statistic
            title="This Week"
            value={recentPapers}
            valueStyle={{ color: '#1890ff' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
        
        <Card size="small" className="text-center">
          <Statistic
            title="Total Questions"
            value={totalMessages}
            valueStyle={{ color: '#722ed1' }}
            prefix={<MessageOutlined />}
          />
        </Card>
        
        <Card size="small" className="text-center">
          <Statistic
            title="Recent Activity"
            value={recentMessages}
            valueStyle={{ color: '#52c41a' }}
            prefix={<ThunderboltOutlined />}
          />
        </Card>
      </div>

      {totalPapers > 0 ? (
        <Alert
          message="Keep Up the Great Work!"
          description={`You have ${totalPapers} papers in your library and have asked ${totalMessages} questions. Your research activity is impressive!`}
          type="success"
          showIcon
          className="mt-4"
        />
      ) : (
        <Alert
          message="Get Started"
          description="Upload your first paper to start tracking your research analytics and get personalized insights."
          type="info"
          showIcon
          className="mt-4"
        />
      )}

      <div className="mt-4">
        <Title level={5} className="mb-3">Recent Activity</Title>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <Text className="text-sm">Papers uploaded this week</Text>
            <Badge count={recentPapers} />
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <Text className="text-sm">Questions asked this week</Text>
            <Badge count={recentMessages} />
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <Text className="text-sm">Research topics explored</Text>
            <Badge count={trends.length} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <Card 
        title={
          <Space>
            <ThunderboltOutlined className="text-blue-600" />
            <span className="font-semibold">Smart Insights</span>
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
              key: 'insights',
              label: (
                <Space>
                  <BulbOutlined />
                  Insights
                </Space>
              ),
              children: insightsTab
            },
            {
              key: 'trends',
              label: (
                <Space>
                  <RiseOutlined />
                  Trends
                </Space>
              ),
              children: trendsTab
            },
            {
              key: 'analytics',
              label: (
                <Space>
                  <BarChartOutlined />
                  Analytics
                </Space>
              ),
              children: analyticsTab
            }
          ]}
        />
      </Card>
    </div>
  );
}
