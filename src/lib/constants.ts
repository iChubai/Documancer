// Application constants

export const APP_CONFIG = {
  name: 'DocuMancer',
  version: '1.0.0',
  description: 'AI-Powered Academic Paper Reading Assistant',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['.pdf'],
  supportedFormats: ['PDF'],
} as const;

export const COLORS = {
  primary: '#1890ff',
  secondary: '#722ed1',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  text: {
    primary: '#262626',
    secondary: '#595959',
    disabled: '#bfbfbf',
  },
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
  },
  border: '#d9d9d9',
} as const;

export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

export const ROUTES = {
  home: '/',
  library: '/library',
  reader: '/reader',
  comparison: '/comparison',
  analysis: '/analysis',
  settings: '/settings',
} as const;

export const API_ENDPOINTS = {
  papers: '/api/papers',
  upload: '/api/upload',
  chat: '/api/chat',
  analysis: '/api/analysis',
  search: '/api/search',
  comparison: '/api/comparison',
} as const;

export const PAPER_FORMATS = {
  ARXIV: 'arXiv',
  IEEE: 'IEEE',
  ACM: 'ACM',
  SPRINGER: 'Springer',
  ELSEVIER: 'Elsevier',
  GENERIC: 'Generic',
} as const;

export const ANALYSIS_TYPES = {
  SUMMARY: 'summary',
  KEY_FINDINGS: 'key_findings',
  METHODOLOGY: 'methodology',
  CONCEPTS: 'concepts',
  CITATIONS: 'citations',
  COMPARISON: 'comparison',
} as const;

export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export const ANNOTATION_TYPES = {
  HIGHLIGHT: 'highlight',
  NOTE: 'note',
  BOOKMARK: 'bookmark',
} as const;

export const VIEW_MODES = {
  READER: 'reader',
  LIBRARY: 'library',
  COMPARISON: 'comparison',
  ANALYSIS: 'analysis',
} as const;

export const LOADING_MESSAGES = [
  'Processing your document...',
  'Extracting text content...',
  'Analyzing paper structure...',
  'Generating insights...',
  'Almost ready...',
] as const;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 50MB',
  INVALID_FILE_TYPE: 'Only PDF files are supported',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  PROCESSING_FAILED: 'Failed to process the document',
  API_ERROR: 'An error occurred while communicating with the server',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'An unexpected error occurred',
} as const;
