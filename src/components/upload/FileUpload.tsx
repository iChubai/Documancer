'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Button, Progress, message, Card, Typography, Space, Alert, List, Tooltip } from 'antd';
import { InboxOutlined, UploadOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useFileUpload, useDragAndDrop } from '@/hooks/useFileUpload';
import { FileUtils } from '@/lib/file-utils';
import { APP_CONFIG } from '@/lib/constants';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface FileUploadProps {
  onUploadSuccess?: (paperId: string) => void;
  className?: string;
  showProgress?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  showFileInfo?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  className = '',
  showProgress = true,
  maxFileSize = APP_CONFIG.maxFileSize,
  allowedTypes = ['.pdf'],
  showFileInfo = true,
}) => {
  const { uploadFile, uploadProgress, isUploading, error, clearError } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = FileUtils.validateFile(file);
    if (!validation.isValid) {
      message.error(validation.error);
      setUploadStatus('error');
      return false;
    }

    setSelectedFile(file);
    setUploadStatus('uploading');
    clearError();

    try {
      // Upload file
      const paper = await uploadFile(file);
      if (paper) {
        message.success('File uploaded successfully!');
        setUploadStatus('success');
        onUploadSuccess?.(paper.id);

        // Reset after a delay
        setTimeout(() => {
          setSelectedFile(null);
          setUploadStatus('idle');
        }, 2000);
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }

    return false; // Prevent default upload behavior
  }, [uploadFile, onUploadSuccess, clearError]);

  const { isDragOver, dragHandlers } = useDragAndDrop((files) => {
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: APP_CONFIG.allowedFileTypes.join(','),
    beforeUpload: handleFileSelect,
    showUploadList: false,
    ...dragHandlers,
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className={`${isDragOver ? 'border-blue-400 bg-blue-50' : ''} transition-all duration-200`}>
        <Dragger {...uploadProps} className="border-dashed">
          <div className={`${isMobile ? 'py-6' : 'py-8'}`}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined className={`${isMobile ? 'text-3xl' : 'text-4xl'} text-blue-500`} />
            </p>
            <Title level={isMobile ? 5 : 4} className="ant-upload-text">
              {isMobile ? 'Tap to upload PDF' : 'Click or drag PDF files to upload'}
            </Title>
            <Text className={`ant-upload-hint text-gray-500 ${isMobile ? 'text-sm' : ''}`}>
              {isMobile
                ? `PDF files only. Max: ${FileUtils.formatFileSize(APP_CONFIG.maxFileSize)}`
                : `Support for academic papers in PDF format. Maximum file size: ${FileUtils.formatFileSize(APP_CONFIG.maxFileSize)}`
              }
            </Text>
          </div>
        </Dragger>
      </Card>

      {/* Upload Progress and Status */}
      {showProgress && (uploadProgress || selectedFile) && (
        <Card className="fade-in">
          <Space direction="vertical" className="w-full">
            <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-3'}`}>
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
                {uploadStatus === 'uploading' && <LoadingOutlined className="text-blue-500" />}
                {uploadStatus === 'success' && <CheckCircleOutlined className="text-green-500" />}
                {uploadStatus === 'error' && <CloseCircleOutlined className="text-red-500" />}
                {uploadStatus === 'idle' && <FileTextOutlined className="text-blue-500" />}

                <div className="flex-1">
                  <Text strong className={isMobile ? 'text-sm' : ''}>{selectedFile?.name || uploadProgress?.fileName}</Text>
                  <div className={`text-gray-500 capitalize ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {uploadStatus === 'uploading' && 'Uploading...'}
                    {uploadStatus === 'success' && 'Upload completed successfully'}
                    {uploadStatus === 'error' && 'Upload failed'}
                    {uploadStatus === 'idle' && uploadProgress?.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {selectedFile && showFileInfo && !isMobile && (
                <Tooltip title="File Information">
                  <div className="text-right text-sm text-gray-500">
                    <div>{FileUtils.formatFileSize(selectedFile.size)}</div>
                    <div>{selectedFile.type || 'PDF'}</div>
                  </div>
                </Tooltip>
              )}

              {selectedFile && showFileInfo && isMobile && (
                <div className="text-center text-xs text-gray-500">
                  {FileUtils.formatFileSize(selectedFile.size)} • {selectedFile.type || 'PDF'}
                </div>
              )}
            </div>

            {uploadProgress && (
              <Progress
                percent={uploadProgress.progress}
                status={
                  uploadProgress.status === 'error'
                    ? 'exception'
                    : uploadProgress.status === 'completed'
                      ? 'success'
                      : 'active'
                }
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            )}

            {uploadProgress?.error && (
              <Text type="danger" className="text-sm">
                {uploadProgress.error}
              </Text>
            )}
          </Space>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <Text type="danger">{error}</Text>
        </Card>
      )}

      {/* Alternative Upload Button */}
      <div className="text-center">
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            loading={isUploading}
            size="large"
            type="primary"
          >
            Choose File
          </Button>
        </Upload>
      </div>

      {/* File Info */}
      <div className="text-center text-sm text-gray-500">
        <div>Supported formats: {APP_CONFIG.supportedFormats.join(', ')}</div>
        <div>Maximum size: {FileUtils.formatFileSize(APP_CONFIG.maxFileSize)}</div>
      </div>
    </div>
  );
};

export default FileUpload;
