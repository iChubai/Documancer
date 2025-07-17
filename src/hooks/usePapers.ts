import { useState, useEffect, useCallback } from 'react';
import { Paper, ApiResponse } from '@/lib/types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';

interface UsePapersReturn {
  papers: Paper[];
  loading: boolean;
  error: string | null;
  fetchPapers: () => Promise<void>;
  fetchPaper: (id: string) => Promise<Paper | null>;
  updatePaper: (id: string, updates: Partial<Paper>) => Promise<boolean>;
  deletePaper: (id: string) => Promise<boolean>;
  searchPapers: (query: string, filters?: any[]) => Promise<Paper[]>;
  refreshPapers: () => Promise<void>;
}

export const usePapers = (): UsePapersReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    papers, 
    setPapers, 
    addPaper, 
    removePaper,
    setError: setGlobalError 
  } = useAppStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.papers);
      const result: ApiResponse<{ papers: Paper[] }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      if (result.data) {
        setPapers(result.data.papers);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setPapers, setGlobalError]);

  const fetchPaper = useCallback(async (id: string): Promise<Paper | null> => {
    try {
      setError(null);

      const response = await fetch(`${API_ENDPOINTS.papers}?id=${id}`);
      const result: ApiResponse<Paper> = await response.json();

      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      return result.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      return null;
    }
  }, []);

  const updatePaper = useCallback(async (id: string, updates: Partial<Paper>): Promise<boolean> => {
    try {
      setError(null);

      const existingPaper = papers.find(p => p.id === id);
      if (!existingPaper) {
        throw new Error('Paper not found');
      }

      const updatedPaper = { ...existingPaper, ...updates };

      const response = await fetch(API_ENDPOINTS.papers, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPaper),
      });

      const result: ApiResponse<Paper> = await response.json();

      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      // Update local state
      setPapers(papers.map(p => p.id === id ? updatedPaper : p));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      setGlobalError(errorMessage);
      return false;
    }
  }, [papers, setPapers, setGlobalError]);

  const deletePaper = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`${API_ENDPOINTS.papers}?id=${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<Paper> = await response.json();

      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      // Update local state
      removePaper(id);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      setGlobalError(errorMessage);
      return false;
    }
  }, [removePaper, setGlobalError]);

  const searchPapers = useCallback(async (query: string, filters: any[] = []): Promise<Paper[]> => {
    try {
      setError(null);

      const searchParams = new URLSearchParams({
        q: query,
        filters: JSON.stringify(filters),
      });

      const response = await fetch(`${API_ENDPOINTS.search}?${searchParams}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      // Convert search results back to papers
      const searchResults = result.data.results;
      const foundPapers = searchResults
        .map((searchResult: any) => papers.find(p => p.id === searchResult.paperId))
        .filter(Boolean);

      return foundPapers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      return [];
    }
  }, [papers]);

  const refreshPapers = useCallback(async () => {
    await fetchPapers();
  }, [fetchPapers]);

  // Load papers on mount
  useEffect(() => {
    if (papers.length === 0) {
      fetchPapers();
    }
  }, [fetchPapers, papers.length]);

  return {
    papers,
    loading,
    error,
    fetchPapers,
    fetchPaper,
    updatePaper,
    deletePaper,
    searchPapers,
    refreshPapers,
  };
};

// Hook for managing paper state
export const usePaperState = (paperId: string | null) => {
  const { papers, currentPaper, setCurrentPaper } = useAppStore();
  const [paper, setPaper] = useState<Paper | null>(null);

  useEffect(() => {
    if (paperId) {
      const foundPaper = papers.find(p => p.id === paperId);
      setPaper(foundPaper || null);
      
      if (foundPaper && currentPaper?.id !== paperId) {
        setCurrentPaper(paperId);
      }
    } else {
      setPaper(null);
    }
  }, [paperId, papers, currentPaper, setCurrentPaper]);

  return paper;
};

// Hook for paper statistics
export const usePaperStats = () => {
  const { papers, readingSessions, annotations } = useAppStore();

  const stats = {
    totalPapers: papers.length,
    totalSessions: readingSessions.length,
    totalAnnotations: annotations.length,
    averageReadingProgress: readingSessions.length > 0 
      ? readingSessions.reduce((sum, session) => sum + session.progress, 0) / readingSessions.length
      : 0,
    papersWithAnnotations: new Set(annotations.map(a => a.paperId)).size,
    mostActiveDay: getMostActiveDay(readingSessions),
    topAuthors: getTopAuthors(papers),
    topTags: getTopTags(papers),
  };

  return stats;
};

function getMostActiveDay(sessions: any[]): string {
  const dayCount: { [key: string]: number } = {};
  
  sessions.forEach(session => {
    const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
    dayCount[day] = (dayCount[day] || 0) + 1;
  });

  return Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b)?.[0] || 'No data';
}

function getTopAuthors(papers: Paper[]): Array<{ name: string; count: number }> {
  const authorCount: { [key: string]: number } = {};
  
  papers.forEach(paper => {
    paper.authors.forEach(author => {
      authorCount[author] = (authorCount[author] || 0) + 1;
    });
  });

  return Object.entries(authorCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getTopTags(papers: Paper[]): Array<{ tag: string; count: number }> {
  const tagCount: { [key: string]: number } = {};
  
  papers.forEach(paper => {
    paper.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
