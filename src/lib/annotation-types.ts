export interface TextSelection {
  startOffset: number;
  endOffset: number;
  selectedText: string;
  pageNumber: number;
  boundingRect?: DOMRect;
}

export interface Annotation {
  id: string;
  paperId: string;
  type: 'highlight' | 'note' | 'bookmark';
  pageNumber: number;
  selection?: TextSelection;
  content: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnnotationGroup {
  paperId: string;
  annotations: Annotation[];
  lastModified: Date;
}

export interface AnnotationFilter {
  type?: Annotation['type'];
  pageNumber?: number;
  searchText?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AnnotationStats {
  totalAnnotations: number;
  highlightCount: number;
  noteCount: number;
  bookmarkCount: number;
  pagesWithAnnotations: number[];
}

export const ANNOTATION_COLORS = {
  yellow: '#FFEB3B',
  green: '#4CAF50',
  blue: '#2196F3',
  red: '#F44336',
  purple: '#9C27B0',
  orange: '#FF9800',
} as const;

export type AnnotationColor = keyof typeof ANNOTATION_COLORS;
