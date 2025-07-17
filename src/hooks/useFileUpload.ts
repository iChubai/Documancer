import { useState, useCallback } from 'react';
import { FileUtils, FileValidationResult } from '@/lib/file-utils';
import { Paper, FileUploadProgress } from '@/lib/types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';

interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<Paper | null>;
  uploadProgress: FileUploadProgress | null;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addPaper, setError: setGlobalError } = useAppStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<Paper | null> => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Validate file
      const validation: FileValidationResult = FileUtils.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Initialize progress
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload file with progress tracking
      const response = await fetch(API_ENDPOINTS.upload, {
        method: 'POST',
        body: formData,
      });

      // Update progress
      setUploadProgress(prev => prev ? {
        ...prev,
        progress: 50,
        status: 'processing',
      } : null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || ERROR_MESSAGES.UPLOAD_FAILED);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.UPLOAD_FAILED);
      }

      // Update progress
      setUploadProgress(prev => prev ? {
        ...prev,
        progress: 90,
      } : null);

      const paper: Paper = result.data.paper;
      
      // Add paper to store
      addPaper(paper);

      // Save paper to backend
      await fetch(API_ENDPOINTS.papers, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paper),
      });

      // Complete progress
      setUploadProgress(prev => prev ? {
        ...prev,
        progress: 100,
        status: 'completed',
      } : null);

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

      return paper;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UPLOAD_FAILED;
      
      setError(errorMessage);
      setGlobalError(errorMessage);
      
      setUploadProgress(prev => prev ? {
        ...prev,
        status: 'error',
        error: errorMessage,
      } : null);

      return null;
    } finally {
      setIsUploading(false);
    }
  }, [addPaper, setGlobalError]);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    error,
    clearError,
  };
};

// Hook for drag and drop functionality
export const useDragAndDrop = (onFileDrop: (files: File[]) => void) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [onFileDrop]);

  return {
    isDragOver,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
};

// Hook for batch file upload
export const useBatchUpload = () => {
  const [uploads, setUploads] = useState<Map<string, FileUploadProgress>>(new Map());
  const { uploadFile } = useFileUpload();

  const uploadFiles = useCallback(async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileId = `${file.name}_${Date.now()}`;
      
      // Initialize progress for this file
      setUploads(prev => new Map(prev.set(fileId, {
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      })));

      try {
        const result = await uploadFile(file);
        
        // Update success status
        setUploads(prev => new Map(prev.set(fileId, {
          fileName: file.name,
          progress: 100,
          status: 'completed',
        })));

        return result;
      } catch (error) {
        // Update error status
        setUploads(prev => new Map(prev.set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        })));

        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    
    // Clear uploads after a delay
    setTimeout(() => {
      setUploads(new Map());
    }, 5000);

    return results.filter(Boolean) as Paper[];
  }, [uploadFile]);

  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    uploadFiles,
    uploads: Array.from(uploads.values()),
    clearUploads,
  };
};
