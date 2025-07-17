import { message, notification } from 'antd';
import { ERROR_MESSAGES } from './constants';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class DocumentError extends Error {
  code: string;
  details?: any;
  context?: string;

  constructor(code: string, message: string, details?: any, context?: string) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
    this.details = details;
    this.context = context;
  }
}

export class APIError extends DocumentError {
  status?: number;

  constructor(message: string, status?: number, details?: any) {
    super('API_ERROR', message, details, 'API');
    this.name = 'APIError';
    this.status = status;
  }
}

export class ValidationError extends DocumentError {
  field?: string;

  constructor(message: string, field?: string, details?: any) {
    super('VALIDATION_ERROR', message, details, 'Validation');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class FileProcessingError extends DocumentError {
  fileName?: string;

  constructor(message: string, fileName?: string, details?: any) {
    super('FILE_PROCESSING_ERROR', message, details, 'FileProcessing');
    this.name = 'FileProcessingError';
    this.fileName = fileName;
  }
}

export class NetworkError extends DocumentError {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR, details?: any) {
    super('NETWORK_ERROR', message, details, 'Network');
    this.name = 'NetworkError';
  }
}

// Error logging service
class ErrorLogger {
  private errors: AppError[] = [];
  private maxErrors = 100;

  log(error: Error | DocumentError, context?: string): void {
    const appError: AppError = {
      code: error instanceof DocumentError ? error.code : 'UNKNOWN_ERROR',
      message: error.message,
      details: error instanceof DocumentError ? error.details : { stack: error.stack },
      timestamp: new Date(),
      context: error instanceof DocumentError ? error.context : context,
    };

    this.errors.unshift(appError);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('DocuMancer Error:', appError);
    }

    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(appError);
    }
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  private sendToLoggingService(error: AppError): void {
    // Implementation for sending errors to external logging service
    // e.g., Sentry, LogRocket, etc.
    console.log('Would send to logging service:', error);
  }
}

export const errorLogger = new ErrorLogger();

// Error handler utility functions
export const handleError = (
  error: Error | DocumentError,
  options: {
    showNotification?: boolean;
    showMessage?: boolean;
    context?: string;
    silent?: boolean;
  } = {}
): void => {
  const {
    showNotification = false,
    showMessage = true,
    context,
    silent = false,
  } = options;

  // Log the error
  errorLogger.log(error, context);

  if (silent) return;

  const errorMessage = error.message || ERROR_MESSAGES.GENERIC_ERROR;

  if (showNotification) {
    notification.error({
      message: 'Error',
      description: errorMessage,
      duration: 5,
    });
  } else if (showMessage) {
    message.error(errorMessage);
  }
};

export const handleAPIError = (
  error: any,
  context?: string
): void => {
  let apiError: APIError;

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    apiError = new APIError(
      data?.error || data?.message || `HTTP ${status} Error`,
      status,
      data
    );
  } else if (error.request) {
    // Request was made but no response received
    apiError = new NetworkError();
  } else {
    // Something else happened
    apiError = new APIError(error.message || ERROR_MESSAGES.API_ERROR);
  }

  handleError(apiError, {
    showNotification: true,
    context: context || 'API',
  });
};

export const handleFileError = (
  error: any,
  fileName?: string,
  context?: string
): void => {
  const fileError = new FileProcessingError(
    error.message || ERROR_MESSAGES.PROCESSING_FAILED,
    fileName,
    error
  );

  handleError(fileError, {
    showNotification: true,
    context: context || 'FileProcessing',
  });
};

export const handleValidationError = (
  message: string,
  field?: string,
  context?: string
): void => {
  const validationError = new ValidationError(message, field);

  handleError(validationError, {
    showMessage: true,
    context: context || 'Validation',
  });
};

// Async error wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, { context });
      return null;
    }
  };
};

// React error boundary helper
export const createErrorBoundaryHandler = (context: string) => {
  return (error: Error, errorInfo: any) => {
    const documentError = new DocumentError(
      'REACT_ERROR',
      error.message,
      { errorInfo, stack: error.stack },
      context
    );

    handleError(documentError, {
      showNotification: true,
      context: 'React',
    });
  };
};

// Retry mechanism
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        handleError(lastError, {
          context: `${context} (Failed after ${maxRetries} attempts)`,
          showNotification: true,
        });
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Network status checker
export const checkNetworkStatus = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online in server environment
};

// Error recovery suggestions
export const getErrorRecoverySuggestions = (error: DocumentError): string[] => {
  const suggestions: string[] = [];

  switch (error.code) {
    case 'NETWORK_ERROR':
      suggestions.push(
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      );
      break;
    
    case 'FILE_PROCESSING_ERROR':
      suggestions.push(
        'Make sure the file is a valid PDF',
        'Check if the file is not corrupted',
        'Try uploading a different file',
        'Ensure the file size is under the limit'
      );
      break;
    
    case 'API_ERROR':
      suggestions.push(
        'Try refreshing the page',
        'Check if the service is available',
        'Wait a moment and try again'
      );
      break;
    
    case 'VALIDATION_ERROR':
      suggestions.push(
        'Check the input format',
        'Make sure all required fields are filled',
        'Verify the data meets the requirements'
      );
      break;
    
    default:
      suggestions.push(
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the problem persists'
      );
  }

  return suggestions;
};
