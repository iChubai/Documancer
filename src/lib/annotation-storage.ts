import { Annotation, AnnotationGroup, AnnotationFilter, AnnotationStats } from './annotation-types';

class AnnotationStorage {
  private readonly STORAGE_KEY = 'documancer_annotations';
  private readonly API_BASE = '/api/annotations';

  // Local storage methods
  private getLocalAnnotations(): Record<string, AnnotationGroup> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load annotations from localStorage:', error);
      return {};
    }
  }

  private saveLocalAnnotations(annotations: Record<string, AnnotationGroup>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(annotations));
    } catch (error) {
      console.error('Failed to save annotations to localStorage:', error);
    }
  }

  // API methods for server-side persistence
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Public methods
  async getAnnotations(paperId: string): Promise<Annotation[]> {
    try {
      // Try to get from server first
      const response = await this.apiRequest(`/${paperId}`);
      return response.data || [];
    } catch (error) {
      // Fallback to local storage
      const localAnnotations = this.getLocalAnnotations();
      return localAnnotations[paperId]?.annotations || [];
    }
  }

  async saveAnnotation(annotation: Annotation): Promise<Annotation> {
    try {
      // Save to server
      const response = await this.apiRequest('', {
        method: 'POST',
        body: JSON.stringify(annotation),
      });
      
      return response.data;
    } catch (error) {
      // Fallback to local storage
      const localAnnotations = this.getLocalAnnotations();
      
      if (!localAnnotations[annotation.paperId]) {
        localAnnotations[annotation.paperId] = {
          paperId: annotation.paperId,
          annotations: [],
          lastModified: new Date(),
        };
      }

      const existingIndex = localAnnotations[annotation.paperId].annotations.findIndex(
        a => a.id === annotation.id
      );

      if (existingIndex >= 0) {
        localAnnotations[annotation.paperId].annotations[existingIndex] = annotation;
      } else {
        localAnnotations[annotation.paperId].annotations.push(annotation);
      }

      localAnnotations[annotation.paperId].lastModified = new Date();
      this.saveLocalAnnotations(localAnnotations);
      
      return annotation;
    }
  }

  async updateAnnotation(annotation: Annotation): Promise<Annotation> {
    annotation.updatedAt = new Date();
    return this.saveAnnotation(annotation);
  }

  async deleteAnnotation(paperId: string, annotationId: string): Promise<void> {
    try {
      // Delete from server
      await this.apiRequest(`/${annotationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Fallback to local storage
      const localAnnotations = this.getLocalAnnotations();
      
      if (localAnnotations[paperId]) {
        localAnnotations[paperId].annotations = localAnnotations[paperId].annotations.filter(
          a => a.id !== annotationId
        );
        localAnnotations[paperId].lastModified = new Date();
        this.saveLocalAnnotations(localAnnotations);
      }
    }
  }

  async filterAnnotations(paperId: string, filter: AnnotationFilter): Promise<Annotation[]> {
    const annotations = await this.getAnnotations(paperId);
    
    return annotations.filter(annotation => {
      if (filter.type && annotation.type !== filter.type) return false;
      if (filter.pageNumber && annotation.pageNumber !== filter.pageNumber) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const contentMatch = annotation.content.toLowerCase().includes(searchLower);
        const selectionMatch = annotation.selection?.selectedText.toLowerCase().includes(searchLower);
        if (!contentMatch && !selectionMatch) return false;
      }
      if (filter.dateRange) {
        const createdAt = new Date(annotation.createdAt);
        if (createdAt < filter.dateRange.start || createdAt > filter.dateRange.end) return false;
      }
      return true;
    });
  }

  async getAnnotationStats(paperId: string): Promise<AnnotationStats> {
    const annotations = await this.getAnnotations(paperId);
    
    const stats: AnnotationStats = {
      totalAnnotations: annotations.length,
      highlightCount: annotations.filter(a => a.type === 'highlight').length,
      noteCount: annotations.filter(a => a.type === 'note').length,
      bookmarkCount: annotations.filter(a => a.type === 'bookmark').length,
      pagesWithAnnotations: [...new Set(annotations.map(a => a.pageNumber))].sort((a, b) => a - b),
    };

    return stats;
  }

  // Bulk operations
  async exportAnnotations(paperId: string): Promise<string> {
    const annotations = await this.getAnnotations(paperId);
    return JSON.stringify(annotations, null, 2);
  }

  async importAnnotations(paperId: string, annotationsJson: string): Promise<void> {
    try {
      const annotations: Annotation[] = JSON.parse(annotationsJson);
      
      for (const annotation of annotations) {
        annotation.paperId = paperId; // Ensure correct paper ID
        await this.saveAnnotation(annotation);
      }
    } catch (error) {
      throw new Error('Invalid annotations format');
    }
  }

  // Sync methods
  async syncWithServer(paperId: string): Promise<void> {
    try {
      const localAnnotations = this.getLocalAnnotations();
      const localGroup = localAnnotations[paperId];
      
      if (!localGroup) return;

      // Upload local annotations to server
      await this.apiRequest('/sync', {
        method: 'POST',
        body: JSON.stringify(localGroup),
      });

      console.log('Annotations synced with server');
    } catch (error) {
      console.error('Failed to sync annotations:', error);
    }
  }
}

export const annotationStorage = new AnnotationStorage();
