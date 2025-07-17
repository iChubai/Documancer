'use client';

import React, { useState, useEffect } from 'react';
import { Spin, Alert, Button } from 'antd';
import { DownloadOutlined, FullscreenOutlined } from '@ant-design/icons';

interface PDFDocumentProps {
  file: string;
  pageNumber: number;
  scale?: number;
  onLoadSuccess: (data: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  onPageLoadSuccess?: () => void;
  onPageLoadError?: (error: Error) => void;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({
  file,
  pageNumber,
  scale = 1.0,
  onLoadSuccess,
  onLoadError,
  onPageLoadSuccess,
  onPageLoadError,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [containerHeight, setContainerHeight] = useState<string>('70vh');

  useEffect(() => {
    // Construct the PDF URL
    let url: string;
    if (file.startsWith('http')) {
      url = file;
    } else if (file.startsWith('/api/files/')) {
      url = file; // Already has the correct path
    } else {
      url = `/api/files/${file}`;
    }
    setPdfUrl(url);

    // Simulate loading success with estimated page count
    setTimeout(() => {
      setLoading(false);
      onLoadSuccess({ numPages: 10 }); // Default estimate
      onPageLoadSuccess?.();
    }, 1000);
  }, [file, onLoadSuccess, onPageLoadSuccess]);

  useEffect(() => {
    const updateHeight = () => {
      const isMobile = window.innerWidth < 768;
      const height = isMobile ? '60vh' : '80vh';
      setContainerHeight(height);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load PDF document');
    onLoadError(new Error('Failed to load PDF document'));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = file.split('/').pop() || 'document.pdf';
    link.click();
  };

  const handleFullscreen = () => {
    window.open(pdfUrl, '_blank');
  };

  if (error) {
    return (
      <div className="pdf-document-container">
        <Alert
          message="Failed to load PDF"
          description={
            <div>
              <p>{error}</p>
              <div className="mt-3 space-x-2">
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  Download PDF
                </Button>
                <Button icon={<FullscreenOutlined />} onClick={handleFullscreen}>
                  Open in New Tab
                </Button>
              </div>
            </div>
          }
          type="error"
          showIcon
          className="m-4"
        />
      </div>
    );
  }

  return (
    <div className="pdf-document-container">
      {loading && (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
          <span className="ml-3">Loading PDF...</span>
        </div>
      )}

      <div className={`pdf-viewer-wrapper ${loading ? 'hidden' : ''}`}>
        <iframe
          src={`${pdfUrl}#page=${pageNumber}&zoom=${Math.round(scale * 100)}`}
          width="100%"
          height={containerHeight}
          style={{
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            minHeight: '50vh',
            maxHeight: 'calc(100vh - 150px)',
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="PDF Document"
        />

        <div className="pdf-controls mt-4 text-center space-x-2">
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download
          </Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFullscreen}>
            Open in New Tab
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFDocument;
