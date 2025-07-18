'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Timeline, 
  Typography, 
  Progress, 
  Tag, 
  Space, 
  Button, 
  Avatar, 
  Tooltip,
  Tabs,
  Statistic,
  Empty,
  Select,
  DatePicker,
  Badge
} from 'antd';
import { 
  ClockCircleOutlined, 
  BookOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  StarOutlined,
  BarChartOutlined,
  CalendarOutlined,
  TrophyOutlined,
  FireOutlined,
  AimOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ReadingSession {
  id: string;
  paperId: string;
  paperTitle: string;
  duration: number; // minutes
  progress: number; // percentage
  timestamp: Date;
  notes: number;
  interactions: number;
  type: 'reading' | 'annotation' | 'analysis' | 'discussion';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt: Date;
  category: 'reading' | 'learning' | 'productivity' | 'collaboration';
}

export default function PaperTimeline() {
  const { papers } = useAppStore();
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const [readingSessions] = useState<ReadingSession[]>([
    {
      id: '1',
      paperId: '1',
      paperTitle: 'Deep Learning for Natural Language Processing',
      duration: 45,
      progress: 35,
      timestamp: new Date('2024-01-18T10:30:00'),
      notes: 5,
      interactions: 12,
      type: 'reading'
    },
    {
      id: '2',
      paperId: '2',
      paperTitle: 'Transformer Architecture Analysis',
      duration: 30,
      progress: 60,
      timestamp: new Date('2024-01-17T15:20:00'),
      notes: 8,
      interactions: 15,
      type: 'annotation'
    },
    {
      id: '3',
      paperId: '1',
      paperTitle: 'Deep Learning for Natural Language Processing',
      duration: 25,
      progress: 80,
      timestamp: new Date('2024-01-16T09:15:00'),
      notes: 3,
      interactions: 8,
      type: 'analysis'
    },
    {
      id: '4',
      paperId: '3',
      paperTitle: 'Computer Vision in Healthcare',
      duration: 55,
      progress: 45,
      timestamp: new Date('2024-01-15T14:00:00'),
      notes: 12,
      interactions: 20,
      type: 'reading'
    },
    {
      id: '5',
      paperId: '2',
      paperTitle: 'Transformer Architecture Analysis',
      duration: 20,
      progress: 100,
      timestamp: new Date('2024-01-14T11:45:00'),
      notes: 2,
      interactions: 5,
      type: 'discussion'
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Steps',
      description: 'Read your first paper',
      icon: <BookOutlined className="text-green-500" />,
      unlockedAt: new Date('2024-01-10'),
      category: 'reading'
    },
    {
      id: '2',
      title: 'Note Taker',
      description: 'Added 50 annotations',
      icon: <FileTextOutlined className="text-blue-500" />,
      unlockedAt: new Date('2024-01-12'),
      category: 'learning'
    },
    {
      id: '3',
      title: 'Speed Reader',
      description: 'Read 5 papers in one day',
      icon: <FireOutlined className="text-orange-500" />,
      unlockedAt: new Date('2024-01-15'),
      category: 'productivity'
    },
    {
      id: '4',
      title: 'Completion Master',
      description: 'Finished 10 papers completely',
      icon: <TrophyOutlined className="text-yellow-500" />,
      unlockedAt: new Date('2024-01-17'),
      category: 'reading'
    }
  ]);

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'reading': return <EyeOutlined className="text-blue-500" />;
      case 'annotation': return <FileTextOutlined className="text-green-500" />;
      case 'analysis': return <BarChartOutlined className="text-orange-500" />;
      case 'discussion': return <MessageOutlined className="text-purple-500" />;
      default: return <BookOutlined />;
    }
  };

  const getSessionColor = (type: string) => {
    switch (type) {
      case 'reading': return 'blue';
      case 'annotation': return 'green';
      case 'analysis': return 'orange';
      case 'discussion': return 'purple';
      default: return 'default';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const totalReadingTime = readingSessions.reduce((sum, session) => sum + session.duration, 0);
  const avgProgress = readingSessions.reduce((sum, session) => sum + session.progress, 0) / readingSessions.length;
  const completedPapers = readingSessions.filter(session => session.progress === 100).length;

  const timelineTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Title level={5}>
          <CalendarOutlined className="mr-2 text-blue-600" />
          Reading Timeline
        </Title>
        
        <Select
          value={selectedPeriod}
          onChange={setSelectedPeriod}
          className="w-32"
        >
          <Select.Option value="today">Today</Select.Option>
          <Select.Option value="week">This Week</Select.Option>
          <Select.Option value="month">This Month</Select.Option>
          <Select.Option value="all">All Time</Select.Option>
        </Select>
      </div>

      <Timeline
        mode="left"
        items={readingSessions.map((session) => ({
          dot: getSessionIcon(session.type),
          color: getSessionColor(session.type),
          children: (
            <div className="pb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Text strong className="text-gray-800">
                    {session.paperTitle}
                  </Text>
                  <Tag color={getSessionColor(session.type)}>
                    {session.type}
                  </Tag>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text type="secondary">
                      {session.timestamp.toLocaleDateString()} at {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text type="secondary">
                      {formatDuration(session.duration)}
                    </Text>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Text className="text-xs text-gray-500 mb-1">Progress</Text>
                      <Progress 
                        percent={session.progress} 
                        size="small" 
                        status={session.progress === 100 ? 'success' : 'active'}
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <FileTextOutlined />
                      <span>{session.notes}</span>
                      <MessageOutlined />
                      <span>{session.interactions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }))}
      />
    </div>
  );

  const statsTab = (
    <div className="space-y-4">
      <Title level={5}>
        <BarChartOutlined className="mr-2 text-green-600" />
        Reading Statistics
      </Title>
      
      <div className="grid grid-cols-2 gap-4">
        <Card size="small" className="text-center">
          <Statistic
            title="Total Reading Time"
            value={Math.floor(totalReadingTime / 60)}
            suffix="hours"
            valueStyle={{ color: '#3f8600' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
        
        <Card size="small" className="text-center">
          <Statistic
            title="Average Progress"
            value={Math.round(avgProgress)}
            suffix="%"
            valueStyle={{ color: '#1890ff' }}
            prefix={<AimOutlined />}
          />
        </Card>
        
        <Card size="small" className="text-center">
          <Statistic
            title="Papers Read"
            value={readingSessions.length}
            valueStyle={{ color: '#722ed1' }}
            prefix={<BookOutlined />}
          />
        </Card>
        
        <Card size="small" className="text-center">
          <Statistic
            title="Completed"
            value={completedPapers}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </div>

      <div className="mt-6">
        <Title level={5} className="mb-3">Recent Activity</Title>
        <div className="space-y-2">
          {readingSessions.slice(0, 3).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getSessionIcon(session.type)}
                <div>
                  <Text strong className="text-sm">{session.paperTitle}</Text>
                  <div className="text-xs text-gray-500">
                    {formatDuration(session.duration)} • {session.progress}% complete
                  </div>
                </div>
              </div>
              <Text type="secondary" className="text-xs">
                {session.timestamp.toLocaleDateString()}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const achievementsTab = (
    <div className="space-y-4">
      <Title level={5}>
        <TrophyOutlined className="mr-2 text-yellow-600" />
        Achievements
      </Title>
      
      <div className="grid grid-cols-1 gap-3">
        {achievements.map((achievement) => (
          <Card key={achievement.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <Avatar size="large" icon={achievement.icon} className="bg-gray-100" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Text strong>{achievement.title}</Text>
                  <Badge 
                    color={
                      achievement.category === 'reading' ? 'blue' :
                      achievement.category === 'learning' ? 'green' :
                      achievement.category === 'productivity' ? 'orange' :
                      'purple'
                    }
                    text={achievement.category}
                  />
                </div>
                <Text type="secondary" className="text-sm">
                  {achievement.description}
                </Text>
                <div className="text-xs text-gray-400 mt-1">
                  Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <Card 
        title={
          <Space>
            <ClockCircleOutlined className="text-blue-600" />
            <span className="font-semibold">Paper Timeline</span>
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
              key: 'timeline',
              label: (
                <Space>
                  <CalendarOutlined />
                  Timeline
                </Space>
              ),
              children: timelineTab
            },
            {
              key: 'stats',
              label: (
                <Space>
                  <BarChartOutlined />
                  Statistics
                </Space>
              ),
              children: statsTab
            },
            {
              key: 'achievements',
              label: (
                <Space>
                  <TrophyOutlined />
                  Achievements
                </Space>
              ),
              children: achievementsTab
            }
          ]}
        />
      </Card>
    </div>
  );
}
