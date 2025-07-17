import { useState, useCallback, useEffect } from 'react';
import { TextSelection } from '@/lib/annotation-types';

export function useTextSelection(currentPage: number = 1) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Get text selection from the DOM
  const getTextSelection = useCallback((): TextSelection | null => {
    const domSelection = window.getSelection();
    
    if (!domSelection || domSelection.rangeCount === 0) {
      return null;
    }

    const range = domSelection.getRangeAt(0);
    const selectedText = domSelection.toString().trim();
    
    if (!selectedText) {
      return null;
    }

    // Find the PDF page element
    const pdfPageElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement?.closest('.react-pdf__Page')
      : (range.commonAncestorContainer as Element).closest('.react-pdf__Page');

    if (!pdfPageElement) {
      return null;
    }

    // Get page number from the PDF page element
    const pageNumber = currentPage; // Use current page as fallback

    // Calculate relative positions within the page
    const pageRect = pdfPageElement.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();

    const textSelection: TextSelection = {
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      selectedText,
      pageNumber,
      boundingRect: rangeRect,
    };

    return textSelection;
  }, [currentPage]);

  // Handle text selection
  const handleTextSelection = useCallback((event?: MouseEvent | React.MouseEvent) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const textSelection = getTextSelection();
      setSelection(textSelection);
      setIsSelecting(false);
    }, 10);
  }, [getTextSelection]);

  // Handle selection start
  const handleSelectionStart = useCallback(() => {
    setIsSelecting(true);
    setSelection(null);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
    
    // Clear DOM selection
    const domSelection = window.getSelection();
    if (domSelection) {
      domSelection.removeAllRanges();
    }
  }, []);

  // Check if there's an active selection
  const hasSelection = selection !== null && selection.selectedText.length > 0;

  // Get selection position for positioning UI elements
  const getSelectionPosition = useCallback(() => {
    if (!selection?.boundingRect) return null;

    const rect = selection.boundingRect;
    return {
      x: rect.left + rect.width / 2,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, [selection]);

  // Restore selection (useful for highlighting)
  const restoreSelection = useCallback((textSelection: TextSelection) => {
    try {
      // This is a simplified version - in a real implementation,
      // you'd need to find the exact text nodes and recreate the range
      const textNodes = document.querySelectorAll('.react-pdf__Page__textContent span');
      
      for (const node of textNodes) {
        if (node.textContent?.includes(textSelection.selectedText)) {
          const range = document.createRange();
          range.selectNodeContents(node);
          
          const domSelection = window.getSelection();
          if (domSelection) {
            domSelection.removeAllRanges();
            domSelection.addRange(range);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Failed to restore selection:', error);
    }
  }, []);

  // Listen for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const domSelection = window.getSelection();
      if (domSelection && domSelection.toString().trim()) {
        setIsSelecting(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Listen for mouse events to detect selection
  useEffect(() => {
    const handleMouseDown = () => {
      handleSelectionStart();
    };

    const handleMouseUp = (event: MouseEvent) => {
      handleTextSelection(event);
    };

    // Only listen on PDF content areas
    const pdfElements = document.querySelectorAll('.react-pdf__Page');
    
    pdfElements.forEach(element => {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mouseup', handleMouseUp);
    });

    return () => {
      pdfElements.forEach(element => {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mouseup', handleMouseUp);
      });
    };
  }, [handleTextSelection, handleSelectionStart]);

  return {
    // State
    selection,
    isSelecting,
    hasSelection,
    
    // Actions
    handleTextSelection,
    handleSelectionStart,
    clearSelection,
    restoreSelection,
    
    // Utilities
    getSelectionPosition,
    getTextSelection,
  };
}
