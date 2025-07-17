import { useState, useCallback } from 'react';
import { message } from 'antd';
import { ComprehensiveAnalysis, ConceptExtraction, QuestionAnswer } from '@/lib/ai-analysis-service';

interface AnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  lastAnalysis: ComprehensiveAnalysis | null;
}

export function useEnhancedAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    error: null,
    lastAnalysis: null,
  });

  const analyzeDocument = useCallback(async (content: string): Promise<ComprehensiveAnalysis | null> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          analysisType: 'comprehensive',
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const analysis = result.data as ComprehensiveAnalysis;
      setState(prev => ({ ...prev, lastAnalysis: analysis }));
      
      message.success('Document analysis completed successfully');
      return analysis;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      message.error(errorMessage);
      return null;
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const extractConcepts = useCallback(async (content: string): Promise<ConceptExtraction[]> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          analysisType: 'concepts',
        }),
      });

      if (!response.ok) {
        throw new Error('Concept extraction failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Concept extraction failed');
      }

      return result.data as ConceptExtraction[];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Concept extraction failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      message.error(errorMessage);
      return [];
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const generateQuestions = useCallback(async (content: string): Promise<string[]> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          analysisType: 'questions',
        }),
      });

      if (!response.ok) {
        throw new Error('Question generation failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Question generation failed');
      }

      return result.data as string[];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Question generation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      message.error(errorMessage);
      return [];
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const summarizeDocument = useCallback(async (content: string): Promise<string | null> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          analysisType: 'summary',
        }),
      });

      if (!response.ok) {
        throw new Error('Summarization failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Summarization failed');
      }

      return result.data as string;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Summarization failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      message.error(errorMessage);
      return null;
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const extractKeyFindings = useCallback(async (content: string): Promise<string[]> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          analysisType: 'key_findings',
        }),
      });

      if (!response.ok) {
        throw new Error('Key findings extraction failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Key findings extraction failed');
      }

      return result.data as string[];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Key findings extraction failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      message.error(errorMessage);
      return [];
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const askQuestion = useCallback(async (content: string, question: string): Promise<QuestionAnswer | null> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperContent: content,
          message: question,
        }),
      });

      if (!response.ok) {
        throw new Error('Question answering failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Question answering failed');
      }

      return result.data as QuestionAnswer;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Question answering failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      message.error(errorMessage);
      return null;
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    lastAnalysis: state.lastAnalysis,

    // Actions
    analyzeDocument,
    extractConcepts,
    generateQuestions,
    summarizeDocument,
    extractKeyFindings,
    askQuestion,
    clearError,
  };
}
