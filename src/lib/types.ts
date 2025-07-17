// Core types for the DocuMancer application

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  content: string;
  filePath: string;
  uploadedAt: Date;
  lastAccessedAt: Date;
  tags: string[];
  summary?: string;
  keyFindings?: string[];
  methodology?: string;
  citations?: Citation[];
  annotations?: Annotation[];
}

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  url?: string;
}

export interface Annotation {
  id: string;
  paperId: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string;
  type: 'highlight' | 'note' | 'bookmark';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  paperId?: string;
  context?: string;
}

export interface PaperAnalysis {
  summary: string;
  keyFindings: string[];
  methodology: string;
  strengths: string[];
  limitations: string[];
  futureWork: string[];
  concepts: Concept[];
}

export interface Concept {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
  relatedTerms: string[];
}

export interface SearchResult {
  paperId: string;
  title: string;
  relevanceScore: number;
  matchedContent: string;
  pageNumber?: number;
}

export interface ReadingSession {
  id: string;
  paperId: string;
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  notes: string[];
  bookmarks: number[]; // page numbers
}

export interface ComparisonResult {
  papers: Paper[];
  similarities: string[];
  differences: string[];
  commonThemes: string[];
  recommendations: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// UI State types
export interface UIState {
  currentPaper: Paper | null;
  selectedPapers: string[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  currentView: 'reader' | 'library' | 'comparison' | 'analysis';
}

// File upload types
export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}
