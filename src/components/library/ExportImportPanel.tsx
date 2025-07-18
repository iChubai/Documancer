'use client';

import React, { useState, useRef } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  Space, 
  Typography, 
  Alert, 
  Progress, 
  Divider,
  Select,
  Tooltip,
  message,
  Modal
} from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  ExportOutlined, 
  ImportOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { exportImportManager, ImportResult } from '@/lib/export-import';
import { annotationStorage } from '@/lib/annotation-storage';
import { Annotation } from '@/lib/annotation-types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ExportImportPanelProps {
  onImportComplete?: (result: ImportResult) => void;
}

/**
 * Export/Import Panel Component
 * Provides comprehensive data export and import functionality
 */
export default function ExportImportPanel({ onImportComplete }: ExportImportPanelProps) {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    papers, 
    annotations, 
    chatMessages, 
    readingSessions,
    currentPaperId,
    addPaper,
    addAnnotation
  } = useAppStore();

  /**
   * Export all data
   */
  const handleExportAll = async () => {
    setExportLoading(true);
    try {
      // Get all annotations grouped by paper
      const annotationsByPaper: Record<string, any[]> = {};
      for (const paper of papers) {
        const paperAnnotations = await annotationStorage.getAnnotations(paper.id);
        annotationsByPaper[paper.id] = paperAnnotations;
      }

      // Get chat history grouped by paper
      const chatByPaper: Record<string, any[]> = {};
      papers.forEach(paper => {
        chatByPaper[paper.id] = chatMessages.filter(msg => msg.paperId === paper.id);
      });

      const exportData = await exportImportManager.exportData(
        papers,
        annotationsByPaper,
        chatByPaper,
        readingSessions
      );

      exportImportManager.downloadExport(exportData);
      message.success('数据导出成功！');
    } catch (error) {
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Export current paper
   */
  const handleExportCurrent = async () => {
    if (!currentPaperId) {
      message.warning('请先选择一篇论文');
      return;
    }

    setExportLoading(true);
    try {
      const currentPaper = papers.find(p => p.id === currentPaperId);
      if (!currentPaper) {
        message.error('当前论文未找到');
        return;
      }

      const annotations = await annotationStorage.getAnnotations(currentPaperId);
      const chatHistory = chatMessages.filter(msg => msg.paperId === currentPaperId);

      const exportData = await exportImportManager.exportPaper(
        currentPaper,
        annotations,
        chatHistory
      );

      exportImportManager.downloadExport(
        exportData, 
        `${currentPaper.title.replace(/[^a-z0-9]/gi, '_')}-export.json`
      );
      message.success('论文数据导出成功！');
    } catch (error) {
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Export annotations only
   */
  const handleExportAnnotations = async () => {
    if (!currentPaperId) {
      message.warning('请先选择一篇论文');
      return;
    }

    setExportLoading(true);
    try {
      const annotations = await annotationStorage.getAnnotations(currentPaperId);
      
      if (annotations.length === 0) {
        message.warning('当前论文没有注释可导出');
        return;
      }

      const exportData = await exportImportManager.exportAnnotations(annotations, selectedFormat);
      const currentPaper = papers.find(p => p.id === currentPaperId);
      const filename = `${currentPaper?.title.replace(/[^a-z0-9]/gi, '_') || 'annotations'}-annotations.${selectedFormat}`;
      
      exportImportManager.downloadExport(exportData, filename);
      message.success(`注释导出成功（${selectedFormat.toUpperCase()}格式）！`);
    } catch (error) {
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Handle PDF file import
   */
  const handlePDFImport = async (file: File) => {
    setImportLoading(true);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Use the existing upload API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('PDF upload failed');
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setImportProgress(100);

      if (result.success && result.data.paper) {
        message.success(`PDF导入成功！论文: ${result.data.paper.title}`);
        // Add the paper to the store
        addPaper(result.data.paper);
        onImportComplete?.({
          success: true,
          imported: { papers: 1, annotations: 0, sessions: 0 },
          errors: []
        });
      } else {
        message.error('PDF导入失败');
        console.error('PDF import error:', result.error);
      }

      // Reset progress after a delay
      setTimeout(() => {
        setImportProgress(0);
      }, 2000);

    } catch (error) {
      message.error('PDF导入失败：' + (error instanceof Error ? error.message : '未知错误'));
      setImportProgress(0);
    } finally {
      setImportLoading(false);
    }

    return false; // Prevent default upload behavior
  };

  /**
   * Handle JSON file import
   */
  const handleJSONImport = async (file: File) => {
    setImportLoading(true);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await exportImportManager.importData(file);
      
      clearInterval(progressInterval);
      setImportProgress(100);

      if (result.success) {
        message.success(
          `JSON导入成功！论文: ${result.imported.papers}, 注释: ${result.imported.annotations}, 会话: ${result.imported.sessions}`
        );
        onImportComplete?.(result);
      } else {
        message.error('JSON导入失败');
        console.error('JSON import errors:', result.errors);
      }

      // Reset progress after a delay
      setTimeout(() => {
        setImportProgress(0);
      }, 2000);

    } catch (error) {
      message.error('JSON导入失败：' + (error instanceof Error ? error.message : '未知错误'));
      setImportProgress(0);
    } finally {
      setImportLoading(false);
    }

    return false; // Prevent default upload behavior
  };

  return (
    <Card 
      title={
        <Space>
          <DatabaseOutlined className="text-blue-600" />
          <span className="font-semibold">数据管理</span>
          <Tooltip title="查看导出/导入帮助">
            <Button 
              type="text" 
              size="small" 
              icon={<InfoCircleOutlined />}
              onClick={() => setHelpModalVisible(true)}
              className="text-gray-500 hover:text-blue-600"
            />
          </Tooltip>
        </Space>
      }
      size="small"
      className="shadow-lg border-0"
      headStyle={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
        borderRadius: '8px 8px 0 0' 
      }}
    >
      <div className="space-y-6">
        {/* Export Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <Title level={5} className="mb-4 text-gray-800">
            <ExportOutlined className="mr-2 text-green-600" />
            数据导出
          </Title>
          
          <Space direction="vertical" className="w-full" size="middle">
            <Button 
              type="primary" 
              block
              loading={exportLoading}
              onClick={handleExportAll}
              icon={<DownloadOutlined />}
              className="h-10 text-base font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              导出所有数据
            </Button>

            <Button 
              block
              loading={exportLoading}
              onClick={handleExportCurrent}
              disabled={!currentPaperId}
              icon={<FileTextOutlined />}
              className="h-10 text-base font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              导出当前论文
            </Button>

            <div className="flex gap-2">
              <Select 
                value={selectedFormat}
                onChange={setSelectedFormat}
                className="flex-1"
                size="large"
              >
                <Option value="json">JSON</Option>
                <Option value="csv">CSV</Option>
                <Option value="txt">TXT</Option>
              </Select>
              <Button 
                loading={exportLoading}
                onClick={handleExportAnnotations}
                disabled={!currentPaperId}
                icon={<ExportOutlined />}
                className="h-10 font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                导出注释
              </Button>
            </div>
          </Space>
        </div>

        <Divider />

        {/* Import Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <Title level={5} className="mb-4 text-gray-800">
            <ImportOutlined className="mr-2 text-purple-600" />
            数据导入
          </Title>
          
          <div className="space-y-3">
            {/* PDF Import */}
            <Upload.Dragger
              accept=".pdf"
              beforeUpload={handlePDFImport}
              showUploadList={false}
              disabled={importLoading}
              className="border-2 border-dashed border-red-300 hover:border-red-400 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <div className="py-6">
                <FileTextOutlined className="text-3xl mb-3 text-red-500" />
                <div className="ant-upload-text text-lg font-medium text-gray-700">
                  点击或拖拽PDF文件到此区域上传
                </div>
                <div className="ant-upload-hint text-gray-500 mt-2">
                  支持学术论文PDF文件导入和解析
                </div>
              </div>
            </Upload.Dragger>

            {/* JSON Import */}
            <Upload.Dragger
              accept=".json"
              beforeUpload={handleJSONImport}
              showUploadList={false}
              disabled={importLoading}
              className="border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="py-6">
                <DatabaseOutlined className="text-3xl mb-3 text-blue-500" />
                <div className="ant-upload-text text-lg font-medium text-gray-700">
                  点击或拖拽JSON文件到此区域上传
                </div>
                <div className="ant-upload-hint text-gray-500 mt-2">
                  支持DocuMancer导出的JSON格式文件
                </div>
              </div>
            </Upload.Dragger>
          </div>

          {importLoading && (
            <div className="mb-3 bg-white p-3 rounded-lg border border-gray-200">
              <Text type="secondary" className="text-sm font-medium">导入进度：</Text>
              <Progress 
                percent={importProgress} 
                size="small" 
                status={importProgress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          )}
        </div>

        {/* Info Alert */}
        <Alert
          message="数据安全提示"
          description="导出的数据包含您的所有论文、注释和分析记录。请妥善保管导出文件，避免泄露个人学术信息。"
          type="info"
          showIcon
          className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        />
      </div>

      {/* Help Modal */}
      <Modal
        title="导出/导入帮助"
        open={helpModalVisible}
        onCancel={() => setHelpModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHelpModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <Title level={5}>导出功能</Title>
            <ul className="list-disc ml-4 space-y-1">
              <li><strong>导出所有数据</strong>：包含所有论文、注释、聊天记录和阅读会话</li>
              <li><strong>导出当前论文</strong>：只导出当前选中论文的相关数据</li>
              <li><strong>导出注释</strong>：支持JSON、CSV、TXT三种格式的注释导出</li>
            </ul>
          </div>

          <div>
            <Title level={5}>导入功能</Title>
            <ul className="list-disc ml-4 space-y-1">
              <li><strong>PDF导入</strong>：直接上传PDF文件，自动解析并添加到论文库</li>
              <li><strong>JSON导入</strong>：支持DocuMancer导出的JSON格式文件</li>
              <li>导入会自动合并数据，不会覆盖现有内容</li>
              <li>支持增量导入和批量恢复</li>
            </ul>
          </div>

          <div>
            <Title level={5}>注意事项</Title>
            <ul className="list-disc ml-4 space-y-1">
              <li>大型数据集导入可能需要较长时间</li>
              <li>请确保有足够的存储空间</li>
              <li>建议定期备份重要数据</li>
              <li>导入前请确认文件来源可信</li>
            </ul>
          </div>
        </div>
      </Modal>
    </Card>
  );
} 