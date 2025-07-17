'use client';

import React, { useState } from 'react';
import { Card, List, Button, Input, Tag, Typography, Space, Popconfirm, Tooltip } from 'antd';
import {
  HighlightOutlined,
  EditOutlined,
  BookOutlined,
  DeleteOutlined,
  EyeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Annotation } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AnnotationPanelProps {
  paperId: string;
  currentPage?: number;
  onAnnotationClick?: (annotation: Annotation) => void;
  className?: string;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  paperId,
  currentPage,
  onAnnotationClick,
  className = '',
}) => {
  const { annotations, removeAnnotation, updateAnnotation } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'highlight' | 'note' | 'bookmark'>('all');

  const paperAnnotations = annotations.filter(a => a.paperId === paperId);
  const filteredAnnotations = paperAnnotations.filter(a => 
    filter === 'all' || a.type === filter
  );

  const handleEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const handleSaveEdit = (annotationId: string) => {
    updateAnnotation(annotationId, { content: editContent });
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (annotationId: string) => {
    removeAnnotation(annotationId);
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'highlight':
        return <HighlightOutlined className="text-yellow-500" />;
      case 'note':
        return <MessageOutlined className="text-blue-500" />;
      case 'bookmark':
        return <BookOutlined className="text-red-500" />;
      default:
        return <EditOutlined />;
    }
  };

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'highlight':
        return 'gold';
      case 'note':
        return 'blue';
      case 'bookmark':
        return 'red';
      default:
        return 'default';
    }
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: paperAnnotations.length },
    { key: 'highlight', label: 'Highlights', count: paperAnnotations.filter(a => a.type === 'highlight').length },
    { key: 'note', label: 'Notes', count: paperAnnotations.filter(a => a.type === 'note').length },
    { key: 'bookmark', label: 'Bookmarks', count: paperAnnotations.filter(a => a.type === 'bookmark').length },
  ];

  return (
    <Card 
      title="Annotations" 
      className={className}
      extra={
        <Text type="secondary" className="text-sm">
          {filteredAnnotations.length} items
        </Text>
      }
    >
      {/* Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterButtons.map(({ key, label, count }) => (
          <Button
            key={key}
            size="small"
            type={filter === key ? 'primary' : 'default'}
            onClick={() => setFilter(key as any)}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {/* Annotations List */}
      <List
        dataSource={filteredAnnotations}
        locale={{ emptyText: 'No annotations yet' }}
        renderItem={(annotation) => (
          <List.Item
            className={`${
              currentPage === annotation.pageNumber ? 'bg-blue-50 border-blue-200' : ''
            } rounded p-3 mb-2 border transition-colors hover:bg-gray-50`}
          >
            <div className="w-full">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getAnnotationIcon(annotation.type)}
                  <Tag color={getAnnotationColor(annotation.type)}>
                    {annotation.type}
                  </Tag>
                  <Text type="secondary" className="text-xs">
                    Page {annotation.pageNumber}
                  </Text>
                </div>
                
                <Space size="small">
                  <Tooltip title="Go to annotation">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onAnnotationClick?.(annotation)}
                    />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(annotation)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete annotation?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(annotation.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </div>

              {editingId === annotation.id ? (
                <div className="space-y-2">
                  <TextArea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    placeholder="Edit annotation content..."
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => handleSaveEdit(annotation.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <Paragraph 
                  className="mb-0 text-sm"
                  ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                >
                  {annotation.content}
                </Paragraph>
              )}

              <Text type="secondary" className="text-xs">
                {new Date(annotation.createdAt).toLocaleString()}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AnnotationPanel;
