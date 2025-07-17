import { APP_CONFIG, ERROR_MESSAGES } from './constants';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

export class FileUtils {
  static validateFile(file: File): FileValidationResult {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided',
      };
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isValidType = APP_CONFIG.allowedFileTypes.some(type => 
      fileName.endsWith(type.toLowerCase())
    );

    if (!isValidType) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      };
    }

    // Check file size
    if (file.size > APP_CONFIG.maxFileSize) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.FILE_TOO_LARGE,
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }

    return {
      isValid: true,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = originalName.replace(`.${extension}`, '');
    
    return `${timestamp}_${randomString}_${nameWithoutExt}.${extension}`;
  }

  static async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  static createFileFromBuffer(buffer: Buffer, filename: string, mimeType: string): File {
    const blob = new Blob([buffer], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  }

  static downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async compressFile(file: File, quality: number = 0.8): Promise<File> {
    // For PDF files, we don't compress as it might affect readability
    // This is a placeholder for future image compression if needed
    if (file.type === 'application/pdf') {
      return file;
    }

    // For other file types, return as-is for now
    return file;
  }

  static getFileIcon(filename: string): string {
    const extension = this.getFileExtension(filename).toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📁';
    }
  }

  static truncateFileName(filename: string, maxLength: number = 30): string {
    if (filename.length <= maxLength) {
      return filename;
    }

    const extension = this.getFileExtension(filename);
    const nameWithoutExt = filename.replace(`.${extension}`, '');
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    
    return `${truncatedName}...${extension}`;
  }

  static isValidPDFHeader(buffer: Buffer): boolean {
    // Check if the buffer starts with PDF header
    const header = buffer.slice(0, 5).toString();
    return header === '%PDF-';
  }

  static extractPDFVersion(buffer: Buffer): string | null {
    // Extract PDF version from header (e.g., %PDF-1.4)
    const header = buffer.slice(0, 8).toString();
    const match = header.match(/%PDF-(\d+\.\d+)/);
    return match ? match[1] : null;
  }
}
