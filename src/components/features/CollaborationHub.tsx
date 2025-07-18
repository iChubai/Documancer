'use client';

import React, { useState } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  Tabs, 
  Input, 
  Select, 
  Badge,
  Tooltip,
  Modal,
  Form,
  message,
  Divider,
  Progress,
  Empty
} from 'antd';
import { 
  TeamOutlined, 
  UserAddOutlined, 
  ShareAltOutlined, 
  MessageOutlined,
  FileTextOutlined,
  EyeOutlined,
  StarOutlined,
  SendOutlined,
  GlobalOutlined,
  LockOutlined,
  UserOutlined,
  CommentOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  BellOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CollaborationGroup {
  id: string;
  name: string;
  description: string;
  members: User[];
  papers: number;
  activity: number;
  isPrivate: boolean;
  createdAt: Date;
  avatar?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  lastActive: Date;
  status: 'online' | 'offline' | 'away';
}

interface SharedPaper {
  id: string;
  title: string;
  author: string;
  sharedBy: User;
  sharedAt: Date;
  comments: number;
  likes: number;
  visibility: 'public' | 'private' | 'group';
  tags: string[];
}

interface Activity {
  id: string;
  type: 'comment' | 'share' | 'like' | 'join' | 'annotation';
  user: User;
  target: string;
  timestamp: Date;
  content?: string;
}

export default function CollaborationHub() {
  const [activeTab, setActiveTab] = useState('groups');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [newGroupModalVisible, setNewGroupModalVisible] = useState(false);
  
  const [groups] = useState<CollaborationGroup[]>([
    {
      id: '1',
      name: 'AI Research Group',
      description: 'Focused on latest developments in artificial intelligence and machine learning',
      members: [
        { id: '1', name: 'Dr. Sarah Chen', email: 'sarah@university.edu', role: 'admin', lastActive: new Date(), status: 'online' },
        { id: '2', name: 'Prof. Michael Brown', email: 'michael@research.com', role: 'member', lastActive: new Date(), status: 'online' },
        { id: '3', name: 'Lisa Wang', email: 'lisa@student.edu', role: 'member', lastActive: new Date(), status: 'away' },
        { id: '4', name: 'John Smith', email: 'john@tech.com', role: 'viewer', lastActive: new Date(), status: 'offline' }
      ],
      papers: 25,
      activity: 85,
      isPrivate: false,
      createdAt: new Date('2024-01-10')
    },
    {
      id: '2',
      name: 'Computer Vision Lab',
      description: 'Exploring computer vision applications in healthcare and autonomous systems',
      members: [
        { id: '5', name: 'Dr. Emily Johnson', email: 'emily@vision.org', role: 'admin', lastActive: new Date(), status: 'online' },
        { id: '6', name: 'Alex Kim', email: 'alex@cv.com', role: 'member', lastActive: new Date(), status: 'online' },
        { id: '7', name: 'Maria Garcia', email: 'maria@student.edu', role: 'member', lastActive: new Date(), status: 'online' }
      ],
      papers: 18,
      activity: 92,
      isPrivate: true,
      createdAt: new Date('2024-01-05')
    }
  ]);

  const [sharedPapers] = useState<SharedPaper[]>([
    {
      id: '1',
      title: 'Attention Is All You Need',
      author: 'Vaswani et al.',
      sharedBy: { id: '1', name: 'Dr. Sarah Chen', email: 'sarah@university.edu', role: 'admin', lastActive: new Date(), status: 'online' },
      sharedAt: new Date('2024-01-17'),
      comments: 12,
      likes: 8,
      visibility: 'group',
      tags: ['transformers', 'attention', 'NLP']
    },
    {
      id: '2',
      title: 'ResNet: Deep Residual Learning for Image Recognition',
      author: 'He et al.',
      sharedBy: { id: '5', name: 'Dr. Emily Johnson', email: 'emily@vision.org', role: 'admin', lastActive: new Date(), status: 'online' },
      sharedAt: new Date('2024-01-16'),
      comments: 8,
      likes: 15,
      visibility: 'public',
      tags: ['CNN', 'residual', 'computer vision']
    },
    {
      id: '3',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers',
      author: 'Devlin et al.',
      sharedBy: { id: '2', name: 'Prof. Michael Brown', email: 'michael@research.com', role: 'member', lastActive: new Date(), status: 'online' },
      sharedAt: new Date('2024-01-15'),
      comments: 6,
      likes: 12,
      visibility: 'group',
      tags: ['BERT', 'NLP', 'transformers']
    }
  ]);

  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'comment',
      user: { id: '1', name: 'Dr. Sarah Chen', email: 'sarah@university.edu', role: 'admin', lastActive: new Date(), status: 'online' },
      target: 'Attention Is All You Need',
      timestamp: new Date('2024-01-18T10:30:00'),
      content: 'This paper revolutionized the field of NLP. The multi-head attention mechanism is brilliant!'
    },
    {
      id: '2',
      type: 'share',
      user: { id: '5', name: 'Dr. Emily Johnson', email: 'emily@vision.org', role: 'admin', lastActive: new Date(), status: 'online' },
      target: 'ResNet paper',
      timestamp: new Date('2024-01-17T15:20:00')
    },
    {
      id: '3',
      type: 'like',
      user: { id: '3', name: 'Lisa Wang', email: 'lisa@student.edu', role: 'member', lastActive: new Date(), status: 'away' },
      target: 'BERT paper',
      timestamp: new Date('2024-01-17T09:15:00')
    },
    {
      id: '4',
      type: 'join',
      user: { id: '7', name: 'Maria Garcia', email: 'maria@student.edu', role: 'member', lastActive: new Date(), status: 'online' },
      target: 'Computer Vision Lab',
      timestamp: new Date('2024-01-16T14:00:00')
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green';
      case 'away': return 'orange';
      case 'offline': return 'gray';
      default: return 'default';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <GlobalOutlined className="text-green-500" />;
      case 'private': return <LockOutlined className="text-orange-500" />;
      case 'group': return <TeamOutlined className="text-blue-500" />;
      default: return <GlobalOutlined />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment': return <CommentOutlined className="text-blue-500" />;
      case 'share': return <ShareAltOutlined className="text-green-500" />;
      case 'like': return <HeartOutlined className="text-red-500" />;
      case 'join': return <UserAddOutlined className="text-purple-500" />;
      case 'annotation': return <EditOutlined className="text-orange-500" />;
      default: return <MessageOutlined />;
    }
  };

  const groupsTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={5}>
          <TeamOutlined className="mr-2 text-blue-600" />
          My Groups
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setNewGroupModalVisible(true)}
        >
          Create Group
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <Card key={group.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar.Group size="small">
                    {group.members.slice(0, 3).map(member => (
                      <Avatar key={member.id} icon={<UserOutlined />} />
                    ))}
                    {group.members.length > 3 && (
                      <Avatar>+{group.members.length - 3}</Avatar>
                    )}
                  </Avatar.Group>
                  <div>
                    <Text strong>{group.name}</Text>
                    {group.isPrivate && <LockOutlined className="ml-2 text-gray-400" />}
                  </div>
                </div>
                
                <Paragraph className="text-sm text-gray-600 mb-2">
                  {group.description}
                </Paragraph>
                
                <div className="flex items-center justify-between">
                  <Space>
                    <Text type="secondary" className="text-xs">
                      {group.papers} papers
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {group.members.length} members
                    </Text>
                  </Space>
                  <div className="flex items-center space-x-1">
                    <Text type="secondary" className="text-xs">Activity</Text>
                    <Progress 
                      percent={group.activity} 
                      size="small" 
                      showInfo={false}
                      className="w-16"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button size="small" icon={<MessageOutlined />} />
                <Button size="small" icon={<SettingOutlined />} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const sharedPapersTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={5}>
          <ShareAltOutlined className="mr-2 text-green-600" />
          Shared Papers
        </Title>
        <Button 
          type="primary" 
          icon={<ShareAltOutlined />}
          onClick={() => setShareModalVisible(true)}
        >
          Share Paper
        </Button>
      </div>

      <div className="space-y-3">
        {sharedPapers.map((paper) => (
          <Card key={paper.id} size="small" className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getVisibilityIcon(paper.visibility)}
                  <Text strong>{paper.title}</Text>
                </div>
                
                <Text type="secondary" className="text-sm">
                  by {paper.author}
                </Text>
                
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text type="secondary" className="text-xs">
                      {paper.sharedBy.name}
                    </Text>
                  </div>
                  <Text type="secondary" className="text-xs">
                    {paper.sharedAt.toLocaleDateString()}
                  </Text>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <Space>
                    {paper.tags.map(tag => (
                      <Tag key={tag} size="small" color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                  <Space>
                    <Badge count={paper.comments} size="small">
                      <CommentOutlined className="text-blue-500" />
                    </Badge>
                    <Badge count={paper.likes} size="small">
                      <HeartOutlined className="text-red-500" />
                    </Badge>
                  </Space>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button size="small" icon={<EyeOutlined />} />
                <Button size="small" icon={<CommentOutlined />} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const activityTab = (
    <div className="space-y-4">
      <Title level={5}>
        <BellOutlined className="mr-2 text-purple-600" />
        Recent Activity
      </Title>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Text strong className="text-sm">{activity.user.name}</Text>
                <Text type="secondary" className="text-xs">
                  {activity.type === 'comment' ? 'commented on' :
                   activity.type === 'share' ? 'shared' :
                   activity.type === 'like' ? 'liked' :
                   activity.type === 'join' ? 'joined' : 'annotated'}
                </Text>
                <Text className="text-sm">{activity.target}</Text>
              </div>
              {activity.content && (
                <Text type="secondary" className="text-xs block mt-1">
                  "{activity.content}"
                </Text>
              )}
              <Text type="secondary" className="text-xs">
                {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <Card 
        title={
          <Space>
            <TeamOutlined className="text-blue-600" />
            <span className="font-semibold">Collaboration Hub</span>
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
              key: 'groups',
              label: (
                <Space>
                  <TeamOutlined />
                  Groups
                </Space>
              ),
              children: groupsTab
            },
            {
              key: 'shared',
              label: (
                <Space>
                  <ShareAltOutlined />
                  Shared Papers
                </Space>
              ),
              children: sharedPapersTab
            },
            {
              key: 'activity',
              label: (
                <Space>
                  <BellOutlined />
                  Activity
                </Space>
              ),
              children: activityTab
            }
          ]}
        />
      </Card>

      {/* Share Paper Modal */}
      <Modal
        title="Share Paper"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Select Paper">
            <Select placeholder="Choose a paper to share">
              <Option value="paper1">Deep Learning for NLP</Option>
              <Option value="paper2">Computer Vision in Healthcare</Option>
              <Option value="paper3">Transformer Architecture</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Share with">
            <Select placeholder="Select group or make public">
              <Option value="public">Public</Option>
              <Option value="group1">AI Research Group</Option>
              <Option value="group2">Computer Vision Lab</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Message (optional)">
            <TextArea placeholder="Add a message about this paper..." />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" block icon={<ShareAltOutlined />}>
              Share Paper
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        title="Create New Group"
        open={newGroupModalVisible}
        onCancel={() => setNewGroupModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Group Name">
            <Input placeholder="Enter group name" />
          </Form.Item>
          
          <Form.Item label="Description">
            <TextArea placeholder="Describe the purpose of this group..." />
          </Form.Item>
          
          <Form.Item label="Privacy">
            <Select defaultValue="private">
              <Option value="private">Private (invitation only)</Option>
              <Option value="public">Public (anyone can join)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" block icon={<PlusOutlined />}>
              Create Group
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
