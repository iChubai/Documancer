import { useState, useEffect, useCallback } from 'react';
import { Annotation, AnnotationFilter, AnnotationStats, TextSelection, AnnotationColor } from '@/lib/annotation-types';
import { annotationStorage } from '@/lib/annotation-storage';
import { message } from 'antd';

export function useAnnotations(paperId: string) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [filter, setFilter] = useState<AnnotationFilter>({});

  // Load annotations
  const loadAnnotations = useCallback(async () => {
    if (!paperId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const loadedAnnotations = await annotationStorage.getAnnotations(paperId);
      setAnnotations(loadedAnnotations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load annotations';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  // Create annotation
  const createAnnotation = useCallback(async (
    type: Annotation['type'],
    content: string,
    selection?: TextSelection,
    color?: AnnotationColor
  ): Promise<Annotation | null> => {
    try {
      const annotation: Annotation = {
        id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paperId,
        type,
        pageNumber: selection?.pageNumber || 1,
        selection,
        content,
        color,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedAnnotation = await annotationStorage.saveAnnotation(annotation);
      setAnnotations(prev => [...prev, savedAnnotation]);
      
      message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`);
      return savedAnnotation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create annotation';
      message.error(errorMessage);
      return null;
    }
  }, [paperId]);

  // Update annotation
  const updateAnnotation = useCallback(async (
    annotationId: string,
    updates: Partial<Annotation>
  ): Promise<boolean> => {
    try {
      const existingAnnotation = annotations.find(a => a.id === annotationId);
      if (!existingAnnotation) {
        throw new Error('Annotation not found');
      }

      const updatedAnnotation = {
        ...existingAnnotation,
        ...updates,
        updatedAt: new Date(),
      };

      await annotationStorage.updateAnnotation(updatedAnnotation);
      
      setAnnotations(prev => 
        prev.map(a => a.id === annotationId ? updatedAnnotation : a)
      );
      
      message.success('Annotation updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update annotation';
      message.error(errorMessage);
      return false;
    }
  }, [annotations]);

  // Delete annotation
  const deleteAnnotation = useCallback(async (annotationId: string): Promise<boolean> => {
    try {
      await annotationStorage.deleteAnnotation(paperId, annotationId);
      
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      
      if (selectedAnnotation?.id === annotationId) {
        setSelectedAnnotation(null);
      }
      
      message.success('Annotation deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete annotation';
      message.error(errorMessage);
      return false;
    }
  }, [paperId, selectedAnnotation]);

  // Filter annotations
  const filteredAnnotations = useCallback(async (newFilter: AnnotationFilter) => {
    try {
      setFilter(newFilter);
      const filtered = await annotationStorage.filterAnnotations(paperId, newFilter);
      return filtered;
    } catch (err) {
      console.error('Failed to filter annotations:', err);
      return annotations;
    }
  }, [paperId, annotations]);

  // Get annotation stats
  const getStats = useCallback(async (): Promise<AnnotationStats | null> => {
    try {
      return await annotationStorage.getAnnotationStats(paperId);
    } catch (err) {
      console.error('Failed to get annotation stats:', err);
      return null;
    }
  }, [paperId]);

  // Export annotations
  const exportAnnotations = useCallback(async (): Promise<string | null> => {
    try {
      const exported = await annotationStorage.exportAnnotations(paperId);
      message.success('Annotations exported successfully');
      return exported;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export annotations';
      message.error(errorMessage);
      return null;
    }
  }, [paperId]);

  // Import annotations
  const importAnnotations = useCallback(async (annotationsJson: string): Promise<boolean> => {
    try {
      await annotationStorage.importAnnotations(paperId, annotationsJson);
      await loadAnnotations(); // Reload annotations
      message.success('Annotations imported successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import annotations';
      message.error(errorMessage);
      return false;
    }
  }, [paperId, loadAnnotations]);

  // Sync with server
  const syncAnnotations = useCallback(async (): Promise<boolean> => {
    try {
      await annotationStorage.syncWithServer(paperId);
      await loadAnnotations(); // Reload annotations
      message.success('Annotations synced successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync annotations';
      message.error(errorMessage);
      return false;
    }
  }, [paperId, loadAnnotations]);

  // Create highlight annotation
  const createHighlight = useCallback((
    selection: TextSelection,
    color: AnnotationColor = 'yellow'
  ) => {
    return createAnnotation('highlight', selection.selectedText, selection, color);
  }, [createAnnotation]);

  // Create note annotation
  const createNote = useCallback((
    content: string,
    selection?: TextSelection,
    pageNumber: number = 1
  ) => {
    return createAnnotation('note', content, selection || { 
      startOffset: 0, 
      endOffset: 0, 
      selectedText: '', 
      pageNumber 
    });
  }, [createAnnotation]);

  // Create bookmark annotation
  const createBookmark = useCallback((
    pageNumber: number,
    title: string = `Bookmark - Page ${pageNumber}`
  ) => {
    return createAnnotation('bookmark', title, {
      startOffset: 0,
      endOffset: 0,
      selectedText: '',
      pageNumber,
    });
  }, [createAnnotation]);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  return {
    // State
    annotations,
    loading,
    error,
    selectedAnnotation,
    filter,
    
    // Actions
    loadAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setSelectedAnnotation,
    
    // Filtering
    filteredAnnotations,
    setFilter,
    
    // Stats and utilities
    getStats,
    exportAnnotations,
    importAnnotations,
    syncAnnotations,
    
    // Convenience methods
    createHighlight,
    createNote,
    createBookmark,
  };
}
