import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Hook for managing user preferences
export const useUserPreferences = () => {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage('documancer-preferences', {
    theme: 'light',
    sidebarCollapsed: false,
    defaultView: 'library',
    pdfViewerScale: 1.0,
    chatAutoScroll: true,
    annotationColors: {
      highlight: '#ffeb3b',
      note: '#2196f3',
      bookmark: '#f44336',
    },
    searchHistory: [] as string[],
    recentPapers: [] as string[],
    favoriteAuthors: [] as string[],
    favoriteTags: [] as string[],
  });

  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  }, [setPreferences]);

  const addToSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setPreferences(prev => ({
      ...prev,
      searchHistory: [
        query,
        ...prev.searchHistory.filter(q => q !== query)
      ].slice(0, 10), // Keep only last 10 searches
    }));
  }, [setPreferences]);

  const addToRecentPapers = useCallback((paperId: string) => {
    setPreferences(prev => ({
      ...prev,
      recentPapers: [
        paperId,
        ...prev.recentPapers.filter(id => id !== paperId)
      ].slice(0, 20), // Keep only last 20 papers
    }));
  }, [setPreferences]);

  const toggleFavoriteAuthor = useCallback((author: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteAuthors: prev.favoriteAuthors.includes(author)
        ? prev.favoriteAuthors.filter(a => a !== author)
        : [...prev.favoriteAuthors, author],
    }));
  }, [setPreferences]);

  const toggleFavoriteTag = useCallback((tag: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteTags: prev.favoriteTags.includes(tag)
        ? prev.favoriteTags.filter(t => t !== tag)
        : [...prev.favoriteTags, tag],
    }));
  }, [setPreferences]);

  return {
    preferences,
    updatePreference,
    addToSearchHistory,
    addToRecentPapers,
    toggleFavoriteAuthor,
    toggleFavoriteTag,
    clearPreferences,
  };
};

// Hook for managing application cache
export const useAppCache = () => {
  const [cache, setCache, clearCache] = useLocalStorage('documancer-cache', {
    analysisResults: {} as Record<string, any>,
    searchResults: {} as Record<string, any>,
    paperMetadata: {} as Record<string, any>,
    lastSync: null as string | null,
  });

  const setCacheItem = useCallback((key: string, value: any, ttl?: number) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttl || 24 * 60 * 60 * 1000, // Default 24 hours
    };

    setCache(prev => ({
      ...prev,
      [key]: item,
    }));
  }, [setCache]);

  const getCacheItem = useCallback((key: string) => {
    const item = cache[key as keyof typeof cache];
    
    if (!item || typeof item !== 'object' || !('timestamp' in item)) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      // Remove expired item
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key as keyof typeof newCache];
        return newCache;
      });
      return null;
    }

    return item.value;
  }, [cache, setCache]);

  const removeCacheItem = useCallback((key: string) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[key as keyof typeof newCache];
      return newCache;
    });
  }, [setCache]);

  const cacheAnalysisResult = useCallback((paperId: string, analysisType: string, result: any) => {
    const key = `analysis_${paperId}_${analysisType}`;
    setCacheItem(key, result, 60 * 60 * 1000); // Cache for 1 hour
  }, [setCacheItem]);

  const getCachedAnalysisResult = useCallback((paperId: string, analysisType: string) => {
    const key = `analysis_${paperId}_${analysisType}`;
    return getCacheItem(key);
  }, [getCacheItem]);

  const cacheSearchResults = useCallback((query: string, filters: any[], results: any) => {
    const key = `search_${query}_${JSON.stringify(filters)}`;
    setCacheItem(key, results, 10 * 60 * 1000); // Cache for 10 minutes
  }, [setCacheItem]);

  const getCachedSearchResults = useCallback((query: string, filters: any[]) => {
    const key = `search_${query}_${JSON.stringify(filters)}`;
    return getCacheItem(key);
  }, [getCacheItem]);

  return {
    cache,
    setCacheItem,
    getCacheItem,
    removeCacheItem,
    cacheAnalysisResult,
    getCachedAnalysisResult,
    cacheSearchResults,
    getCachedSearchResults,
    clearCache,
  };
};

// Hook for managing offline state
export const useOfflineState = () => {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  const [offlineQueue, setOfflineQueue, clearOfflineQueue] = useLocalStorage('documancer-offline-queue', [] as any[]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToOfflineQueue = useCallback((action: any) => {
    setOfflineQueue(prev => [...prev, { ...action, timestamp: Date.now() }]);
  }, [setOfflineQueue]);

  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    // Process queued actions when back online
    for (const action of offlineQueue) {
      try {
        // Process the action based on its type
        console.log('Processing offline action:', action);
        // Implementation would depend on action type
      } catch (error) {
        console.error('Error processing offline action:', error);
      }
    }

    clearOfflineQueue();
  }, [offlineQueue, clearOfflineQueue]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, [isOnline, offlineQueue.length, processOfflineQueue]);

  return {
    isOnline,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
  };
};

export default useLocalStorage;
