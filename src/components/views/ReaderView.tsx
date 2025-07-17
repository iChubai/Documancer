'use client';

import React, { useState } from 'react';
import { Button, Typography, Empty, Tabs } from 'antd';
import { BookOutlined, ArrowLeftOutlined, MessageOutlined, HighlightOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { VIEW_MODES } from '@/lib/constants';
import PDFViewer from '@/components/pdf/PDFViewer';
import ChatInterface from '@/components/chat/ChatInterface';
import QuickActions from '@/components/chat/QuickActions';
import AnnotationPanel from '@/components/pdf/AnnotationPanel';
import { Annotation } from '@/lib/types';

const { Title, Text } = Typography;

const ReaderView: React.FC = () => {
  const { currentPaper, setCurrentView } = useAppStore();
  const [activeTab, setActiveTab] = useState('chat');

  const handleBackToLibrary = () => {
    setCurrentView(VIEW_MODES.LIBRARY);
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    // In a real implementation, you would scroll to the annotation
    console.log('Navigate to annotation:', annotation);
  };

  if (!currentPaper) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <Empty
          image={<BookOutlined className="text-6xl text-gray-400" />}
          description="No paper selected"
        >
          <Button type="primary" onClick={handleBackToLibrary}>
            Go to Library
          </Button>
        </Empty>
      </div>
    );
  }

  const sidebarTabs = [
    {
      key: 'chat',
      label: (
        <span>
          <MessageOutlined />
          Chat
        </span>
      ),
      children: (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <ChatInterface paper={currentPaper} />
          </div>
          <div className="mt-4">
            <QuickActions paper={currentPaper} />
          </div>
        </div>
      ),
    },
    {
      key: 'annotations',
      label: (
        <span>
          <HighlightOutlined />
          Notes
        </span>
      ),
      children: (
        <AnnotationPanel
          paperId={currentPaper.id}
          onAnnotationClick={handleAnnotationClick}
          className="h-full"
        />
      ),
    },
  ];

  return (
    <div className="h-full flex">
      {/* PDF Viewer Side */}
      <div className="flex-1 bg-gray-50 p-4">
        <div className="mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToLibrary}
            className="mb-2"
          >
            Back to Library
          </Button>
          <Title level={4} className="m-0 mb-1">
            {currentPaper.title}
          </Title>
          <Text type="secondary">
            by {currentPaper.authors.join(', ')}
          </Text>
        </div>

        <PDFViewer
          paper={currentPaper}
          className="h-full"
          onAnnotationCreate={(annotation) => {
            console.log('New annotation created:', annotation);
          }}
        />
      </div>

      {/* Sidebar */}
      <div className="w-96 border-l bg-white">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={sidebarTabs}
          className="h-full"
          tabBarStyle={{
            margin: 0,
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0'
          }}
        />
      </div>
    </div>
  );
};

export default ReaderView;
