/**
 * Large File Handler
 * Optimized handling for large PDF files with chunked upload and streaming processing
 */

import { APP_CONFIG } from './constants';

export interface FileChunk {
  chunk: Blob;
  index: number;
  size: number;
  start: number;
  end: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  chunksCompleted: number;
  totalChunks: number;
  currentChunk: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface ChunkUploadResult {
  success: boolean;
  chunkIndex: number;
  error?: string;
  retries?: number;
}

class LargeFileHandler {
  private readonly CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
  private readonly MAX_RETRIES = 3;
  private readonly CONCURRENT_UPLOADS = 3;

  /**
   * Check if file requires chunked upload
   * @param file - File to check
   * @returns boolean indicating if chunked upload is needed
   */
  requiresChunkedUpload(file: File): boolean {
    return file.size > 10 * 1024 * 1024; // 10MB threshold
  }

  /**
   * Split file into chunks
   * @param file - File to chunk
   * @returns Array of file chunks
   */
  createChunks(file: File): FileChunk[] {
    const chunks: FileChunk[] = [];
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      chunks.push({
        chunk,
        index: i,
        size: chunk.size,
        start,
        end
      });
    }

    return chunks;
  }

  /**
   * Upload file with chunked upload support
   * @param file - File to upload
   * @param onProgress - Progress callback
   * @returns Promise<string> - Upload session ID
   */
  async uploadLargeFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    if (!this.requiresChunkedUpload(file)) {
      return this.uploadSmallFile(file, onProgress);
    }

    const chunks = this.createChunks(file);
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    let completedBytes = 0;

    // Initialize upload session
    await this.initializeUploadSession(sessionId, file.name, file.size, chunks.length);

    // Upload chunks with concurrency control
    const results = await this.uploadChunksConcurrently(
      chunks,
      sessionId,
      (chunkResult) => {
        if (chunkResult.success) {
          completedBytes += chunks[chunkResult.chunkIndex].size;
          
          if (onProgress) {
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = completedBytes / elapsed;
            const remainingBytes = file.size - completedBytes;
            const estimatedTimeRemaining = remainingBytes / speed;

            onProgress({
              loaded: completedBytes,
              total: file.size,
              percentage: (completedBytes / file.size) * 100,
              chunksCompleted: results.filter(r => r?.success).length,
              totalChunks: chunks.length,
              currentChunk: chunkResult.chunkIndex + 1,
              speed,
              estimatedTimeRemaining
            });
          }
        }
      }
    );

    // Check if all chunks uploaded successfully
    const failedChunks = results.filter(r => !r.success);
    if (failedChunks.length > 0) {
      throw new Error(`Failed to upload ${failedChunks.length} chunks`);
    }

    // Finalize upload
    await this.finalizeUpload(sessionId);
    return sessionId;
  }

  /**
   * Upload small files using traditional method
   */
  private async uploadSmallFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
            chunksCompleted: event.loaded === event.total ? 1 : 0,
            totalChunks: 1,
            currentChunk: 1,
            speed: event.loaded / ((Date.now() - startTime) / 1000),
            estimatedTimeRemaining: 0
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.sessionId || 'direct-upload');
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      const startTime = Date.now();
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }

  /**
   * Upload chunks with controlled concurrency
   */
  private async uploadChunksConcurrently(
    chunks: FileChunk[],
    sessionId: string,
    onChunkComplete: (result: ChunkUploadResult) => void
  ): Promise<ChunkUploadResult[]> {
    const results: (ChunkUploadResult | null)[] = new Array(chunks.length).fill(null);
    const pending: Promise<void>[] = [];

    for (let i = 0; i < chunks.length; i += this.CONCURRENT_UPLOADS) {
      const batch = chunks.slice(i, i + this.CONCURRENT_UPLOADS);
      
      const batchPromises = batch.map(async (chunk) => {
        const result = await this.uploadChunkWithRetry(chunk, sessionId);
        results[chunk.index] = result;
        onChunkComplete(result);
      });

      pending.push(...batchPromises);

      // Wait for current batch to complete before starting next
      await Promise.all(batchPromises);
    }

    await Promise.all(pending);
    return results as ChunkUploadResult[];
  }

  /**
   * Upload a single chunk with retry logic
   */
  private async uploadChunkWithRetry(
    chunk: FileChunk,
    sessionId: string,
    retries = 0
  ): Promise<ChunkUploadResult> {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk.chunk);
      formData.append('chunkIndex', chunk.index.toString());
      formData.append('sessionId', sessionId);
      formData.append('start', chunk.start.toString());
      formData.append('end', chunk.end.toString());

      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Chunk upload failed');
      }

      return {
        success: true,
        chunkIndex: chunk.index,
        retries
      };

    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        // Exponential backoff
        await this.delay(Math.pow(2, retries) * 1000);
        return this.uploadChunkWithRetry(chunk, sessionId, retries + 1);
      }

      return {
        success: false,
        chunkIndex: chunk.index,
        error: error instanceof Error ? error.message : 'Unknown error',
        retries
      };
    }
  }

  /**
   * Initialize upload session on server
   */
  private async initializeUploadSession(
    sessionId: string,
    filename: string,
    fileSize: number,
    totalChunks: number
  ): Promise<void> {
    const response = await fetch('/api/upload/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        filename,
        fileSize,
        totalChunks
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize upload session: ${response.statusText}`);
    }
  }

  /**
   * Finalize upload and trigger processing
   */
  private async finalizeUpload(sessionId: string): Promise<void> {
    const response = await fetch('/api/upload/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error(`Failed to finalize upload: ${response.statusText}`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel ongoing upload
   */
  async cancelUpload(sessionId: string): Promise<void> {
    await fetch('/api/upload/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
  }

  /**
   * Get upload progress for existing session
   */
  async getUploadProgress(sessionId: string): Promise<UploadProgress | null> {
    try {
      const response = await fetch(`/api/upload/progress/${sessionId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.progress || null;
    } catch {
      return null;
    }
  }
}

export const largeFileHandler = new LargeFileHandler();
export default largeFileHandler; 