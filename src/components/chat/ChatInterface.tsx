'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Avatar, Typography, Space, Divider, Tooltip, Dropdown } from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
  DownloadOutlined,
  CopyOutlined,
  MoreOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { ChatMessage, Paper } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface ChatInterfaceProps {
  paper: Paper;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  paper,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const { chatMessages, clearChatMessages } = useAppStore();
  const { askQuestion, isAnalyzing } = useAIAnalysis();

  const paperMessages = chatMessages.filter(msg => msg.paperId === paper.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [paperMessages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isAnalyzing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      await askQuestion(paper, userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    clearChatMessages();
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleExportChat = () => {
    const chatContent = paperMessages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const suggestedQuestions = [
    "What are the main findings of this paper?",
    "Can you summarize the methodology?",
    "What are the key contributions?",
    "What are the limitations mentioned?",
    "How does this relate to previous work?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const chatMenuItems = [
    {
      key: 'clear',
      label: 'Clear Chat',
      icon: <ClearOutlined />,
      onClick: handleClearChat,
    },
    {
      key: 'export',
      label: 'Export Chat',
      icon: <DownloadOutlined />,
      onClick: handleExportChat,
    },
  ];

  return (
    <Card 
      className={`chat-container ${className}`}
      title={
        <div className="flex items-center justify-between">
          <Space>
            <RobotOutlined className="text-blue-500" />
            <span>AI Assistant</span>
          </Space>
          <Dropdown menu={{ items: chatMenuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      }
      styles={{
        body: {
          padding: 0,
          height: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Messages Area */}
      <div className="chat-messages flex-1 overflow-y-auto p-4 space-y-4">
        {paperMessages.length === 0 ? (
          <div className="text-center py-8">
            <RobotOutlined className="text-4xl text-gray-400 mb-4" />
            <Text type="secondary" className="block mb-4">
              Ask me anything about this paper!
            </Text>
            
            {/* Suggested Questions */}
            <div className="space-y-2">
              <div className="flex items-center justify-center mb-3">
                <BulbOutlined className="text-yellow-500 mr-2" />
                <Text strong>Suggested questions:</Text>
              </div>
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  type="dashed"
                  size="small"
                  className="block mx-auto mb-2"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          paperMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%]`}>
                {message.role === 'assistant' && (
                  <Avatar 
                    icon={<RobotOutlined />} 
                    className="bg-blue-500 flex-shrink-0"
                  />
                )}
                
                <div
                  className={`message-bubble ${
                    message.role === 'user' 
                      ? 'message-user bg-blue-500 text-white' 
                      : 'message-assistant bg-gray-100'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <SyntaxHighlighter
                                style={tomorrow as any}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${className} bg-gray-100 px-2 py-1 rounded text-sm`} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <Paragraph className="mb-0 text-inherit">
                      {message.content}
                    </Paragraph>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 border-opacity-20">
                    <Text 
                      className={`text-xs ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                    
                    <Tooltip title="Copy message">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyMessage(message.content)}
                        className={message.role === 'user' ? 'text-blue-100 hover:text-white' : ''}
                      />
                    </Tooltip>
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar 
                    icon={<UserOutlined />} 
                    className="bg-gray-500 flex-shrink-0"
                  />
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {(isAnalyzing || isTyping) && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <Avatar 
                icon={<RobotOutlined />} 
                className="bg-blue-500"
              />
              <div className="message-bubble message-assistant bg-gray-100">
                <div className="loading-dots">Thinking...</div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <Divider className="m-0" />

      {/* Input Area */}
      <div className="chat-input p-4">
        <div className="flex space-x-2">
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question about this paper..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="flex-1"
            disabled={isAnalyzing}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isAnalyzing}
            loading={isAnalyzing}
          >
            Send
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{paperMessages.length} messages</span>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;
