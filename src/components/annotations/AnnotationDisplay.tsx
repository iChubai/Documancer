'use client';

import React, { useState } from 'react';
import { Card, List, Button, Input, Select, Space, Typography, Tag, Tooltip, Popconfirm, Empty } from 'antd';
import { 
  HighlightOutlined, 
  MessageOutlined, 
  BookOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { Annotation, AnnotationFilter, ANNOTATION_COLORS } from '@/lib/annotation-types';
import { formatDistanceToNow } from 'date-fns';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AnnotationDisplayProps {
  annotations: Annotation[];
  loading?: boolean;
  onUpdateAnnotation: (annotationId: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onFilterChange: (filter: AnnotationFilter) => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onSync: () => void;
  currentPage?: number;
  onPageJump?: (pageNumber: number) => void;
}

const AnnotationDisplay: React.FC<AnnotationDisplayProps> = ({
  annotations,
  loading = false,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onFilterChange,
  onExport,
  onImport,
  onSync,
  currentPage,
  onPageJump,
}) => {
  const [filter, setFilter] = useState<AnnotationFilter>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchText, setSearchText] = useState('');

  const handleFilterChange = (newFilter: Partial<AnnotationFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange(updatedFilter);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    handleFilterChange({ searchText: value || undefined });
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const handleSaveEdit = (annotationId: string) => {
    onUpdateAnnotation(annotationId, { content: editContent });
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const getAnnotationIcon = (type: Annotation['type']) => {
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

  const getAnnotationColor = (annotation: Annotation) => {
    if (annotation.type === 'highlight' && annotation.color) {
      return ANNOTATION_COLORS[annotation.color];
    }
    return undefined;
  };

  const filteredAnnotations = annotations.filter(annotation => {
    if (filter.type && annotation.type !== filter.type) return false;
    if (filter.pageNumber && annotation.pageNumber !== filter.pageNumber) return false;
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const contentMatch = annotation.content.toLowerCase().includes(searchLower);
      const selectionMatch = annotation.selection?.selectedText.toLowerCase().includes(searchLower);
      if (!contentMatch && !selectionMatch) return false;
    }
    return true;
  });

  const groupedAnnotations = filteredAnnotations.reduce((groups, annotation) => {
    const page = annotation.pageNumber;
    if (!groups[page]) {
      groups[page] = [];
    }
    groups[page].push(annotation);
    return groups;
  }, {} as Record<number, Annotation[]>);

  return (
    <div className="annotation-display h-full flex flex-col">
      {/* Header with controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <Text strong className="text-lg">Annotations ({annotations.length})</Text>
          <Space>
            <Tooltip title="Export annotations">
              <Button icon={<ExportOutlined />} size="small" onClick={onExport} />
            </Tooltip>
            <Tooltip title="Sync annotations">
              <Button icon={<SyncOutlined />} size="small" onClick={onSync} />
            </Tooltip>
          </Space>
        </div>

        {/* Search and filters */}
        <Space direction="vertical" className="w-full">
          <Input
            placeholder="Search annotations..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
          
          <Space wrap>
            <Select
              placeholder="Filter by type"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => handleFilterChange({ type: value })}
            >
              <Option value="highlight">Highlights</Option>
              <Option value="note">Notes</Option>
              <Option value="bookmark">Bookmarks</Option>
            </Select>
            
            <Select
              placeholder="Filter by page"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => handleFilterChange({ pageNumber: value })}
            >
              {Array.from(new Set(annotations.map(a => a.pageNumber)))
                .sort((a, b) => a - b)
                .map(page => (
                  <Option key={page} value={page}>Page {page}</Option>
                ))}
            </Select>
          </Space>
        </Space>
      </div>

      {/* Annotations list */}
      <div className="flex-1 overflow-auto">
        {filteredAnnotations.length === 0 ? (
          <Empty
            description="No annotations found"
            className="mt-8"
          />
        ) : (
          Object.entries(groupedAnnotations)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([pageNumber, pageAnnotations]) => (
              <div key={pageNumber} className="mb-4">
                <div className="px-4 py-2 bg-gray-100 border-b">
                  <Button
                    type="link"
                    className="p-0 h-auto font-semibold"
                    onClick={() => onPageJump?.(Number(pageNumber))}
                  >
                    Page {pageNumber} ({pageAnnotations.length})
                  </Button>
                </div>
                
                <List
                  dataSource={pageAnnotations}
                  renderItem={(annotation) => (
                    <List.Item className="px-4 py-3 hover:bg-gray-50">
                      <div className="w-full">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getAnnotationIcon(annotation.type)}
                            <Tag 
                              color={annotation.type === 'highlight' ? 'gold' : 
                                     annotation.type === 'note' ? 'blue' : 'red'}
                            >
                              {annotation.type}
                            </Tag>
                            {annotation.type === 'highlight' && annotation.color && (
                              <div
                                className="w-3 h-3 rounded border"
                                style={{ backgroundColor: getAnnotationColor(annotation) }}
                              />
                            )}
                          </div>
                          
                          <Space size="small">
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
                              onConfirm={() => onDeleteAnnotation(annotation.id)}
                              okText="Delete"
                              cancelText="Cancel"
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

                        {/* Selected text (for highlights and notes) */}
                        {annotation.selection?.selectedText && (
                          <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
                            <Text italic>"{annotation.selection.selectedText}"</Text>
                          </div>
                        )}

                        {/* Annotation content */}
                        {editingId === annotation.id ? (
                          <div className="space-y-2">
                            <TextArea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              maxLength={500}
                            />
                            <Space>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => handleSaveEdit(annotation.id)}
                              >
                                Save
                              </Button>
                              <Button size="small" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </Space>
                          </div>
                        ) : (
                          <Paragraph className="mb-2">
                            {annotation.content}
                          </Paragraph>
                        )}

                        {/* Timestamp */}
                        <Text type="secondary" className="text-xs">
                          {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                          {annotation.updatedAt !== annotation.createdAt && (
                            <span> (edited {formatDistanceToNow(new Date(annotation.updatedAt), { addSuffix: true })})</span>
                          )}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AnnotationDisplay;
