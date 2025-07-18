'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Slider, 
  Typography, 
  Space, 
  Drawer,
  FloatButton,
  message,
  Spin
} from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  LeftOutlined, 
  RightOutlined,
  MenuOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  HighlightOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface MobilePDFViewerProps {
  pdfUrl: string;
  paperId: string;
  onAnnotationCreate?: (annotation: any) => void;
}

interface TouchPosition {
  x: number;
  y: number;
}

interface GestureState {
  isZooming: boolean;
  isPanning: boolean;
  lastDistance: number;
  lastCenter: TouchPosition;
  initialScale: number;
}

/**
 * Mobile-optimized PDF viewer with touch gestures and responsive design
 * Supports pinch-to-zoom, pan, and touch-based annotations
 */
export default function MobilePDFViewer({ 
  pdfUrl, 
  paperId, 
  onAnnotationCreate 
}: MobilePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectionMode, setSelectionMode] = useState<'highlight' | 'note' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<GestureState>({
    isZooming: false,
    isPanning: false,
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    initialScale: 1.0
  });

  const { sidebarCollapsed } = useAppStore();

  /**
   * Calculate distance between two touch points
   */
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Get center point between two touches
   */
  const getCenter = useCallback((touch1: React.Touch, touch2: React.Touch): TouchPosition => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  /**
   * Handle touch start events
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Two-finger gesture (zoom)
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);
      
      gestureRef.current = {
        isZooming: true,
        isPanning: false,
        lastDistance: distance,
        lastCenter: center,
        initialScale: scale
      };
    } else if (e.touches.length === 1) {
      // Single finger (pan or select)
      const touch = e.touches[0];
      gestureRef.current = {
        ...gestureRef.current,
        isPanning: true,
        lastCenter: { x: touch.clientX, y: touch.clientY }
      };
    }
  }, [scale, getDistance, getCenter]);

  /**
   * Handle touch move events
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && gestureRef.current.isZooming) {
      // Handle zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = distance / gestureRef.current.lastDistance;
      const newScale = Math.max(0.5, Math.min(3.0, scale * scaleChange));
      
      setScale(newScale);
      gestureRef.current.lastDistance = distance;
    } else if (e.touches.length === 1 && gestureRef.current.isPanning && scale > 1) {
      // Handle pan when zoomed in
      const touch = e.touches[0];
      const deltaX = touch.clientX - gestureRef.current.lastCenter.x;
      const deltaY = touch.clientY - gestureRef.current.lastCenter.y;
      
      if (pageRef.current) {
        const currentTransform = pageRef.current.style.transform;
        const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        
        let currentX = 0, currentY = 0;
        if (translateMatch) {
          currentX = parseFloat(translateMatch[1]) || 0;
          currentY = parseFloat(translateMatch[2]) || 0;
        }
        
        pageRef.current.style.transform = 
          `scale(${scale}) translate(${currentX + deltaX}px, ${currentY + deltaY}px)`;
      }
      
      gestureRef.current.lastCenter = { x: touch.clientX, y: touch.clientY };
    }
  }, [scale, getDistance]);

  /**
   * Handle touch end events
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      gestureRef.current.isZooming = false;
      gestureRef.current.isPanning = false;
    }
  }, []);

  /**
   * Handle double tap to zoom
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const newScale = scale > 1 ? 1 : 2;
    setScale(newScale);
    
    if (pageRef.current && newScale === 1) {
      pageRef.current.style.transform = `scale(1)`;
    }
  }, [scale]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  /**
   * Handle page navigation
   */
  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  /**
   * Handle zoom controls
   */
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3.0, prev + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  }, []);

  /**
   * Reset view
   */
  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    if (pageRef.current) {
      pageRef.current.style.transform = `scale(1)`;
    }
  }, []);

  /**
   * Handle text selection for annotations
   */
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && selectionMode) {
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Create annotation
      const annotation = {
        id: `annotation_${Date.now()}`,
        paperId,
        type: selectionMode,
        content: selectedText,
        pageNumber,
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        createdAt: new Date()
      };
      
      onAnnotationCreate?.(annotation);
      selection.removeAllRanges();
      setSelectionMode(null);
      message.success(`${selectionMode === 'highlight' ? '高亮' : '注释'}已添加`);
    }
  }, [selectionMode, paperId, pageNumber, onAnnotationCreate]);

  // Listen for text selection
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

  // Calculate responsive dimensions
  const getPageWidth = useCallback(() => {
    if (!containerRef.current) return 300;
    const containerWidth = containerRef.current.clientWidth;
    return Math.min(containerWidth - 40, 800); // Max width 800px with padding
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 sticky top-0 z-50">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          className="md:hidden"
        />
        
        <Space className="flex-1 justify-center">
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            size="small"
          />
          <Text className="text-sm font-medium">
            {pageNumber} / {numPages}
          </Text>
          <Button
            type="text"
            icon={<RightOutlined />}
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            size="small"
          />
        </Space>

        <Button
          type="text"
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={toggleFullscreen}
          size="small"
        />
      </div>

      {/* PDF Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        style={{ touchAction: 'none' }}
      >
        <div className="h-full flex items-center justify-center p-4">
          <div ref={pageRef} className="transition-transform duration-200">
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setIsLoading(false);
              }}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
                setIsLoading(false);
                message.error('PDF加载失败');
              }}
              loading={<Spin size="large" />}
            >
              <Page 
                pageNumber={pageNumber}
                width={getPageWidth()}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<Spin />}
              />
            </Document>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <Spin size="large" />
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute right-4 bottom-20 space-y-2">
          <FloatButton
            icon={<ZoomInOutlined />}
            onClick={zoomIn}
          />
          <FloatButton
            icon={<ZoomOutOutlined />}
            onClick={zoomOut}
          />
          <FloatButton
            icon={<HighlightOutlined />}
            type={selectionMode === 'highlight' ? 'primary' : 'default'}
            onClick={() => setSelectionMode(selectionMode === 'highlight' ? null : 'highlight')}
          />
          <FloatButton
            icon={<CommentOutlined />}
            type={selectionMode === 'note' ? 'primary' : 'default'}
            onClick={() => setSelectionMode(selectionMode === 'note' ? null : 'note')}
          />
        </div>
      </div>

      {/* Mobile Controls Drawer */}
      <Drawer
        title="PDF控制"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
      >
        <div className="space-y-6">
          {/* Page Navigation */}
          <div>
            <Text strong className="block mb-2">页面导航</Text>
            <Slider
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={setPageNumber}
              tooltip={{ formatter: value => `第 ${value} 页` }}
            />
          </div>

          {/* Zoom Control */}
          <div>
            <Text strong className="block mb-2">缩放 ({Math.round(scale * 100)}%)</Text>
            <Slider
              min={0.5}
              max={3.0}
              step={0.1}
              value={scale}
              onChange={setScale}
              tooltip={{ formatter: value => `${Math.round(value! * 100)}%` }}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <Text strong className="block mb-2">快速操作</Text>
            <Space direction="vertical" className="w-full">
              <Button onClick={resetView} block>
                重置视图
              </Button>
              <Button onClick={() => setRotation(prev => (prev + 90) % 360)} block>
                旋转页面
              </Button>
            </Space>
          </div>

          {/* Annotation Tools */}
          <div>
            <Text strong className="block mb-2">注释工具</Text>
            <Space direction="vertical" className="w-full">
              <Button
                type={selectionMode === 'highlight' ? 'primary' : 'default'}
                onClick={() => setSelectionMode(selectionMode === 'highlight' ? null : 'highlight')}
                icon={<HighlightOutlined />}
                block
              >
                高亮工具
              </Button>
              <Button
                type={selectionMode === 'note' ? 'primary' : 'default'}
                onClick={() => setSelectionMode(selectionMode === 'note' ? null : 'note')}
                icon={<CommentOutlined />}
                block
              >
                注释工具
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>

      {/* Bottom Status Bar (Mobile) */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>缩放: {Math.round(scale * 100)}%</span>
          {selectionMode && (
            <span className="text-blue-500">
              {selectionMode === 'highlight' ? '高亮模式' : '注释模式'}
            </span>
          )}
          <span>双击缩放</span>
        </div>
      </div>
    </div>
  );
} 