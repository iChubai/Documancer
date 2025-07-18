/**
 * Export/Import utilities for DocuMancer
 * Supports exporting and importing papers, annotations, and analysis results
 */

import { Paper, ChatMessage, ReadingSession } from './types';
import { Annotation } from './annotation-types';
import { format } from 'date-fns';

export interface ExportData {
  version: string;
  exportedAt: string;
  papers: Paper[];
  annotations: Record<string, Annotation[]>;
  chatHistory: Record<string, ChatMessage[]>;
  readingSessions: ReadingSession[];
  metadata: {
    totalPapers: number;
    totalAnnotations: number;
    totalSessions: number;
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    papers: number;
    annotations: number;
    sessions: number;
  };
  errors: string[];
}

class ExportImportManager {
  private readonly CURRENT_VERSION = '1.0.0';

  /**
   * Export all user data to a JSON file
   * @param papers - Array of papers to export
   * @param annotations - Annotations grouped by paper ID
   * @param chatHistory - Chat messages grouped by paper ID
   * @param readingSessions - Reading sessions
   * @returns Promise<Blob> - JSON file as blob
   */
  async exportData(
    papers: Paper[],
    annotations: Record<string, Annotation[]> = {},
    chatHistory: Record<string, ChatMessage[]> = {},
    readingSessions: ReadingSession[] = []
  ): Promise<Blob> {
    const exportData: ExportData = {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      papers,
      annotations,
      chatHistory,
      readingSessions,
      metadata: {
        totalPapers: papers.length,
        totalAnnotations: Object.values(annotations).flat().length,
        totalSessions: readingSessions.length,
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Export data as downloadable file
   * @param data - Export data
   * @param filename - Optional filename (default: documancer-export-{date}.json)
   */
  downloadExport(data: Blob, filename?: string): void {
    const defaultFilename = `documancer-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(data);
    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Export specific paper with its data
   * @param paper - Paper to export
   * @param annotations - Paper annotations
   * @param chatMessages - Paper chat history
   * @returns Promise<Blob> - JSON file as blob
   */
  async exportPaper(
    paper: Paper,
    annotations: Annotation[] = [],
    chatMessages: ChatMessage[] = []
  ): Promise<Blob> {
    const exportData = {
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      paper,
      annotations,
      chatMessages,
      metadata: {
        paperTitle: paper.title,
        annotationCount: annotations.length,
        messageCount: chatMessages.length,
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Export annotations as various formats
   * @param annotations - Annotations to export
   * @param format - Export format ('json' | 'csv' | 'txt')
   * @returns Promise<Blob> - File as blob
   */
  async exportAnnotations(
    annotations: Annotation[],
    format: 'json' | 'csv' | 'txt' = 'json'
  ): Promise<Blob> {
    switch (format) {
      case 'csv':
        return this.exportAnnotationsAsCSV(annotations);
      case 'txt':
        return this.exportAnnotationsAsText(annotations);
      default:
        return new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' });
    }
  }

  /**
   * Export annotations as CSV format
   */
  private exportAnnotationsAsCSV(annotations: Annotation[]): Blob {
    const headers = ['ID', 'Paper ID', 'Type', 'Content', 'Page', 'Created At'];
    const rows = annotations.map(ann => [
      ann.id,
      ann.paperId,
      ann.type,
      `"${ann.content.replace(/"/g, '""')}"`, // Escape quotes
      ann.pageNumber?.toString() || '',
      ann.createdAt.toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }

  /**
   * Export annotations as plain text format
   */
  private exportAnnotationsAsText(annotations: Annotation[]): Blob {
    const textContent = annotations.map(ann => {
      return `${ann.type.toUpperCase()}: ${ann.content}\nPage: ${ann.pageNumber || 'N/A'}\nCreated: ${ann.createdAt.toLocaleDateString()}\n---\n`;
    }).join('\n');

    return new Blob([textContent], { type: 'text/plain' });
  }

  /**
   * Import data from JSON file
   * @param file - JSON file to import
   * @returns Promise<ImportResult> - Import result
   */
  async importData(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      // Validate data structure
      if (!this.validateImportData(data)) {
        return {
          success: false,
          imported: { papers: 0, annotations: 0, sessions: 0 },
          errors: ['Invalid file format or corrupted data']
        };
      }

      // Process import
      const result = await this.processImport(data);
      return result;

    } catch (error) {
      return {
        success: false,
        imported: { papers: 0, annotations: 0, sessions: 0 },
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: any): data is ExportData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.version === 'string' &&
      Array.isArray(data.papers) &&
      typeof data.annotations === 'object' &&
      data.metadata &&
      typeof data.metadata === 'object'
    );
  }

  /**
   * Process the actual import
   */
  private async processImport(data: ExportData): Promise<ImportResult> {
    const errors: string[] = [];
    let importedPapers = 0;
    let importedAnnotations = 0;
    let importedSessions = 0;

    try {
      // Import papers
      for (const paper of data.papers) {
        try {
          await this.importPaper(paper);
          importedPapers++;
        } catch (error) {
          errors.push(`Failed to import paper "${paper.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Import annotations
      for (const [paperId, annotations] of Object.entries(data.annotations)) {
        try {
          await this.importAnnotations(paperId, annotations);
          importedAnnotations += annotations.length;
        } catch (error) {
          errors.push(`Failed to import annotations for paper ${paperId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Import reading sessions
      if (data.readingSessions) {
        try {
          await this.importReadingSessions(data.readingSessions);
          importedSessions = data.readingSessions.length;
        } catch (error) {
          errors.push(`Failed to import reading sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        imported: {
          papers: importedPapers,
          annotations: importedAnnotations,
          sessions: importedSessions
        },
        errors
      };

    } catch (error) {
      return {
        success: false,
        imported: { papers: 0, annotations: 0, sessions: 0 },
        errors: [`Import process failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Import a single paper
   */
  private async importPaper(paper: Paper): Promise<void> {
    const response = await fetch('/api/papers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paper)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Import annotations for a paper
   */
  private async importAnnotations(paperId: string, annotations: Annotation[]): Promise<void> {
    const response = await fetch('/api/annotations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId, annotations })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Import reading sessions
   */
  private async importReadingSessions(sessions: ReadingSession[]): Promise<void> {
    const response = await fetch('/api/sessions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessions)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

export const exportImportManager = new ExportImportManager();
export default exportImportManager; 