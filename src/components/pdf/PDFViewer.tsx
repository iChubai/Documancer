'use client';

import React, { useState, useRef, useEffect } from 'react';
import '@/styles/pdf-viewer.css';
import dynamic from 'next/dynamic';
import { Card, Button, Input, Slider, Space, Tooltip, Typography, Spin, message, Drawer } from 'antd';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useTextSelection } from '@/hooks/useTextSelection';
import AnnotationToolbar from '@/components/annotations/AnnotationToolbar';
import AnnotationDisplay from '@/components/annotations/AnnotationDisplay';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  SearchOutlined,
  HighlightOutlined,
  EditOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { Paper } from '@/lib/types';
import { Annotation } from '@/lib/annotation-types';

// Dynamic import for PDF component to avoid SSR issues
const PDFDocument = dynamic(() => import('./PDFDocument'), {
  ssr: false,
  loading: () => <Spin size="large" />,
});

const { Text } = Typography;

interface PDFViewerProps {
  paper: Paper;
  className?: string;
  onAnnotationCreate?: (annotation: Annotation) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  paper,
  className = '',
  onAnnotationCreate,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Adjust scale for mobile - use better defaults
      if (mobile && scale > 1.2) {
        setScale(1.0); // Keep reasonable scale for mobile
      } else if (!mobile && scale < 0.8) {
        setScale(1.0); // Reset to normal for desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [scale]);

  // Annotation hooks
  const {
    annotations,
    loading: annotationsLoading,
    createHighlight,
    createNote,
    createBookmark,
    updateAnnotation,
    deleteAnnotation,
    exportAnnotations,
    importAnnotations,
    syncAnnotations,
  } = useAnnotations(paper.id);

  const {
    selection,
    hasSelection,
    getSelectionPosition,
    clearSelection,
    handleTextSelection,
  } = useTextSelection(currentPage);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    message.success('PDF loaded successfully');
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    message.error('Failed to load PDF: ' + error.message);
  };

  const onPageLoadSuccess = () => {
    // Page loaded successfully
  };

  const onPageLoadError = (error: Error) => {
    console.error('Error loading page:', error);
    message.warning('Failed to load page: ' + error.message);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.3));
  };

  const handleFitToWidth = () => {
    setScale(1.0);
  };

  const handleActualSize = () => {
    setScale(1.0);
  };

  const handleScaleChange = (value: number) => {
    setScale(value);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    // In a real implementation, you would download the PDF file
    const link = document.createElement('a');
    link.href = paper.filePath;
    link.download = `${paper.title}.pdf`;
    link.click();
  };

  // Annotation handlers
  const handleCreateHighlight = async (selection: any, color: any) => {
    try {
      const annotation = await createHighlight(selection, color);
      if (annotation) {
        onAnnotationCreate?.(annotation);
        clearSelection();
        message.success('Highlight created successfully');
      }
    } catch (error) {
      console.error('Failed to create highlight:', error);
      message.error('Failed to create highlight');
    }
  };

  const handleCreateNote = async (selection: any, content: string) => {
    try {
      const annotation = await createNote(content, selection, currentPage);
      if (annotation) {
        onAnnotationCreate?.(annotation);
        clearSelection();
        message.success('Note created successfully');
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      message.error('Failed to create note');
    }
  };

  const handleCreateBookmark = async (pageNumber: number, title: string) => {
    try {
      const annotation = await createBookmark(pageNumber, title);
      if (annotation) {
        onAnnotationCreate?.(annotation);
        message.success('Bookmark created successfully');
      }
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      message.error('Failed to create bookmark');
    }
  };

  const handleExportAnnotations = async () => {
    const exported = await exportAnnotations();
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paper.title}_annotations.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const currentPageAnnotations = annotations.filter(a => a.pageNumber === currentPage);

  return (
    <div className={`pdf-viewer ${className} h-full flex flex-col`} ref={containerRef}>
      {/* Toolbar */}
      <Card className="mb-4" styles={{ body: { padding: '12px 16px' } }}>
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between'}`}>
          <Space className={isMobile ? 'w-full justify-center' : ''}>
            {/* Navigation */}
            <Button
              icon={<LeftOutlined />}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              size={isMobile ? 'large' : 'middle'}
            />
            <Input
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
              className={`text-center ${isMobile ? 'w-20' : 'w-16'}`}
              size={isMobile ? 'large' : 'small'}
            />
            <Text>of {numPages}</Text>
            <Button
              icon={<RightOutlined />}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= numPages}
              size={isMobile ? 'large' : 'middle'}
            />
          </Space>

          <Space className={isMobile ? 'w-full justify-center' : ''}>
            {/* Zoom Controls */}
            <Button
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              size={isMobile ? 'large' : 'middle'}
            />
            {!isMobile && (
              <Slider
                min={0.3}
                max={3.0}
                step={0.1}
                value={scale}
                onChange={handleScaleChange}
                className="w-32"
              />
            )}
            <Button
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              size={isMobile ? 'large' : 'middle'}
            />
            <Text className="w-12 text-center">{Math.round(scale * 100)}%</Text>
          </Space>

          <Space className={isMobile ? 'w-full justify-center' : ''}>
            {/* Annotation Tools */}
            <Tooltip title="Toggle Annotations Panel">
              <Button
                icon={<EditOutlined />}
                type={showAnnotations ? 'primary' : 'default'}
                onClick={() => setShowAnnotations(!showAnnotations)}
                size={isMobile ? 'large' : 'middle'}
              />
            </Tooltip>

            {!isMobile && (
              <>
                <Tooltip title="Export Annotations">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportAnnotations}
                  />
                </Tooltip>
                <Tooltip title="Sync Annotations">
                  <Button
                    icon={<BookOutlined />}
                    onClick={syncAnnotations}
                    loading={annotationsLoading}
                  />
                </Tooltip>
              </>
            )}
          </Space>

          {!isMobile && (
            <Space>
              {/* Search */}
              <Input
                placeholder="Search in document..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-48"
                size="small"
              />

              {/* Actions */}
              <Button icon={<FullscreenOutlined />} onClick={handleFullscreen} />
              <Button icon={<DownloadOutlined />} onClick={handleDownload} />
            </Space>
          )}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col' : 'flex-row'} gap-4 h-full`}>
        {/* PDF Content */}
        <Card className="flex-1 overflow-auto h-full" styles={{ body: { padding: 0, height: '100%' } }}>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Spin size="large" />
            </div>
          )}

          <div className="relative">
            <PDFDocument
              file={paper.filePath}
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onPageLoadSuccess={onPageLoadSuccess}
              onPageLoadError={onPageLoadError}
            />

            {/* Annotation Toolbar */}
            <AnnotationToolbar
              selection={selection}
              position={getSelectionPosition()}
              onCreateHighlight={handleCreateHighlight}
              onCreateNote={handleCreateNote}
              onCreateBookmark={handleCreateBookmark}
              visible={hasSelection}
              currentPage={currentPage}
            />
          </div>
        </Card>

        {/* Annotations Panel - Desktop */}
        {!isMobile && showAnnotations && (
          <Card className="w-80 h-full" styles={{ body: { padding: 0 } }}>
            <AnnotationDisplay
              annotations={annotations}
              loading={annotationsLoading}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={deleteAnnotation}
              onFilterChange={() => {}}
              onExport={handleExportAnnotations}
              onImport={importAnnotations}
              onSync={syncAnnotations}
              currentPage={currentPage}
              onPageJump={setCurrentPage}
            />
          </Card>
        )}

        {/* Annotations Panel - Mobile Drawer */}
        {isMobile && (
          <Drawer
            title="Annotations"
            placement="bottom"
            onClose={() => setShowAnnotations(false)}
            open={showAnnotations}
            height="70vh"
            styles={{ body: { padding: 0 } }}
          >
            <AnnotationDisplay
              annotations={annotations}
              loading={annotationsLoading}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={deleteAnnotation}
              onFilterChange={() => {}}
              onExport={handleExportAnnotations}
              onImport={importAnnotations}
              onSync={syncAnnotations}
              currentPage={currentPage}
              onPageJump={setCurrentPage}
            />
          </Drawer>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
        <div>
          {annotations.length} annotations
        </div>
        <div>
          Page {currentPage} of {numPages}
        </div>
        <div>
          {selection?.selectedText && `Selected: "${selection.selectedText.substring(0, 50)}${selection.selectedText.length > 50 ? '...' : ''}"`}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
