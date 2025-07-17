'use client';

import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Space, Dropdown, Progress, Tooltip, Avatar } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  StarOutlined,
  StarFilled,
  DownloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Paper } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const { Title, Text, Paragraph } = Typography;

interface PaperCardProps {
  paper: Paper;
  onView: (paper: Paper) => void;
  onEdit?: (paper: Paper) => void;
  onDelete?: (paper: Paper) => void;
  className?: string;
}

const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onView,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { readingSessions } = useAppStore();

  // Get reading progress for this paper
  const paperSessions = readingSessions.filter(s => s.paperId === paper.id);
  const latestSession = paperSessions[paperSessions.length - 1];
  const readingProgress = latestSession?.progress || 0;

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, you would download the PDF
    const link = document.createElement('a');
    link.href = paper.filePath;
    link.download = `${paper.title}.pdf`;
    link.click();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, you would implement sharing functionality
    navigator.clipboard.writeText(`Check out this paper: ${paper.title}`);
  };

  const menuItems = [
    {
      key: 'view',
      label: 'View Paper',
      icon: <EyeOutlined />,
      onClick: () => onView(paper),
    },
    {
      key: 'edit',
      label: 'Edit Details',
      icon: <EditOutlined />,
      onClick: () => onEdit?.(paper),
    },
    {
      key: 'download',
      label: 'Download PDF',
      icon: <DownloadOutlined />,
      onClick: handleDownload,
    },
    {
      key: 'share',
      label: 'Share',
      icon: <ShareAltOutlined />,
      onClick: handleShare,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete?.(paper),
    },
  ];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      hoverable
      className={`paper-card hover-lift ${className}`}
      onClick={() => onView(paper)}
      actions={[
        <Button 
          type="text" 
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onView(paper);
          }}
          key="view"
        >
          View
        </Button>,
        <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'} key="favorite">
          <Button
            type="text"
            icon={isFavorite ? <StarFilled className="text-yellow-500" /> : <StarOutlined />}
            onClick={handleFavoriteToggle}
          />
        </Tooltip>,
        <Dropdown 
          menu={{ items: menuItems }}
          trigger={['click']}
          key="more"
        >
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>,
      ]}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileTextOutlined className="text-blue-500 text-xl" />
            {readingProgress > 0 && (
              <Progress
                type="circle"
                size={20}
                percent={readingProgress}
                showInfo={false}
                strokeColor="#52c41a"
              />
            )}
          </div>
          <Text type="secondary" className="text-xs">
            {formatDate(paper.uploadedAt)}
          </Text>
        </div>
        
        {/* Title */}
        <Title level={5} className="mb-2 line-clamp-2 min-h-[2.5rem]">
          {paper.title}
        </Title>
        
        {/* Authors */}
        <div className="flex items-center mb-3">
          <div className="flex -space-x-1 mr-2">
            {paper.authors.slice(0, 3).map((author, index) => (
              <Tooltip title={author} key={index}>
                <Avatar 
                  size="small" 
                  className="border-2 border-white bg-blue-500"
                >
                  {getInitials(author)}
                </Avatar>
              </Tooltip>
            ))}
            {paper.authors.length > 3 && (
              <Avatar size="small" className="border-2 border-white bg-gray-400">
                +{paper.authors.length - 3}
              </Avatar>
            )}
          </div>
          <Text className="text-sm text-gray-600 truncate flex-1">
            {paper.authors.slice(0, 2).join(', ')}
            {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
          </Text>
        </div>
        
        {/* Abstract */}
        <Paragraph 
          className="text-sm text-gray-600 flex-1 mb-3"
          ellipsis={{ rows: 3, tooltip: paper.abstract }}
        >
          {paper.abstract}
        </Paragraph>
        
        {/* Reading Progress */}
        {readingProgress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <Text className="text-xs text-gray-500">Reading Progress</Text>
              <Text className="text-xs text-gray-500">{readingProgress}%</Text>
            </div>
            <Progress 
              percent={readingProgress} 
              size="small" 
              showInfo={false}
              strokeColor="#1890ff"
            />
          </div>
        )}
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {paper.tags.slice(0, 3).map((tag) => (
            <Tag 
              key={tag} 
              size="small" 
              color="blue"
              className="cursor-pointer hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                // In a real implementation, you would filter by this tag
              }}
            >
              {tag}
            </Tag>
          ))}
          {paper.tags.length > 3 && (
            <Tag size="small" className="cursor-pointer">
              +{paper.tags.length - 3}
            </Tag>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <CalendarOutlined className="mr-1" />
              {formatDate(paper.lastAccessedAt)}
            </span>
          </div>
          
          {paperSessions.length > 0 && (
            <Text className="text-xs text-gray-500">
              {paperSessions.length} session{paperSessions.length > 1 ? 's' : ''}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PaperCard;
