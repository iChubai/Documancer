import { useState, useCallback } from 'react';
import { Paper, PaperAnalysis, ChatMessage } from '@/lib/types';
import { API_ENDPOINTS, ANALYSIS_TYPES, ERROR_MESSAGES } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';

interface UseAIAnalysisReturn {
  analyzeDocument: (paper: Paper, analysisType: string) => Promise<string | null>;
  askQuestion: (paper: Paper, question: string) => Promise<ChatMessage | null>;
  comparePapers: (papers: Paper[]) => Promise<string | null>;
  isAnalyzing: boolean;
  error: string | null;
  clearError: () => void;
}

export const useAIAnalysis = (): UseAIAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addChatMessage, setError: setGlobalError } = useAppStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const analyzeDocument = useCallback(async (
    paper: Paper, 
    analysisType: string
  ): Promise<string | null> => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.analysis, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperId: paper.id,
          content: paper.content,
          analysisType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || ERROR_MESSAGES.API_ERROR);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      return result.data.result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      setGlobalError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [setGlobalError]);

  const askQuestion = useCallback(async (
    paper: Paper, 
    question: string
  ): Promise<ChatMessage | null> => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: question,
        timestamp: new Date(),
        paperId: paper.id,
      };

      addChatMessage(userMessage);

      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          paperId: paper.id,
          paperContent: paper.content,
          context: `Paper: ${paper.title}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || ERROR_MESSAGES.API_ERROR);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      const assistantMessage: ChatMessage = result.data.message;
      addChatMessage(assistantMessage);

      return assistantMessage;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      setGlobalError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        paperId: paper.id,
      };
      
      addChatMessage(errorChatMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [addChatMessage, setGlobalError]);

  const comparePapers = useCallback(async (papers: Paper[]): Promise<string | null> => {
    try {
      setIsAnalyzing(true);
      setError(null);

      if (papers.length < 2) {
        throw new Error('At least 2 papers are required for comparison');
      }

      // For now, we'll compare the first two papers
      // In a full implementation, you might want to handle multiple papers differently
      const [paper1, paper2] = papers;

      const response = await fetch('/api/comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paper1: {
            id: paper1.id,
            title: paper1.title,
            content: paper1.content,
          },
          paper2: {
            id: paper2.id,
            title: paper2.title,
            content: paper2.content,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || ERROR_MESSAGES.API_ERROR);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.API_ERROR);
      }

      return result.data.comparison;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.API_ERROR;
      setError(errorMessage);
      setGlobalError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [setGlobalError]);

  return {
    analyzeDocument,
    askQuestion,
    comparePapers,
    isAnalyzing,
    error,
    clearError,
  };
};

// Hook for streaming chat responses
export const useStreamingChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  const { addChatMessage } = useAppStore();

  const streamQuestion = useCallback(async (
    paper: Paper,
    question: string,
    onChunk?: (chunk: string) => void
  ) => {
    try {
      setIsStreaming(true);
      setStreamingMessage('');

      // Add user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: question,
        timestamp: new Date(),
        paperId: paper.id,
      };
      addChatMessage(userMessage);

      const response = await fetch(
        `${API_ENDPOINTS.chat}?message=${encodeURIComponent(question)}&content=${encodeURIComponent(paper.content)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Streaming complete, add final message
              const assistantMessage: ChatMessage = {
                id: `msg_${Date.now()}_assistant`,
                role: 'assistant',
                content: fullMessage,
                timestamp: new Date(),
                paperId: paper.id,
              };
              addChatMessage(assistantMessage);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                fullMessage += parsed.chunk;
                setStreamingMessage(fullMessage);
                onChunk?.(parsed.chunk);
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question.',
        timestamp: new Date(),
        paperId: paper.id,
      };
      addChatMessage(errorMessage);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  }, [addChatMessage]);

  return {
    streamQuestion,
    isStreaming,
    streamingMessage,
  };
};
