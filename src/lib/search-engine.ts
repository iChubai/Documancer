/**
 * Advanced Search Engine for DocuMancer
 * Supports full-text search, metadata filtering, and advanced query parsing
 */

import { Paper } from './types';

export interface SearchFilter {
  authors?: string[];
  tags?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  contentType?: 'title' | 'abstract' | 'content' | 'all';
  minScore?: number;
}

export interface SearchQuery {
  text: string;
  filters?: SearchFilter;
  sortBy?: 'relevance' | 'date' | 'title' | 'author';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  paper: Paper;
  score: number;
  highlights: SearchHighlight[];
  matchedFields: string[];
}

export interface SearchHighlight {
  field: string;
  text: string;
  start: number;
  end: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: SearchFacets;
  suggestions: string[];
  queryTime: number;
}

export interface SearchFacets {
  authors: Array<{ name: string; count: number }>;
  tags: Array<{ name: string; count: number }>;
  years: Array<{ year: number; count: number }>;
}

class SearchEngine {
  private papers: Paper[] = [];
  private searchHistory: string[] = [];
  private readonly MAX_HISTORY = 20;

  /**
   * Initialize search engine with papers
   */
  initialize(papers: Paper[]): void {
    this.papers = papers;
  }

  /**
   * Perform advanced search
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();

    // Parse and normalize query
    const normalizedQuery = this.normalizeQuery(query.text);
    const tokens = this.tokenize(normalizedQuery);

    // Filter papers based on criteria
    let filteredPapers = this.applyFilters(this.papers, query.filters);

    // Perform text search if query is provided
    let searchResults: SearchResult[] = [];
    if (tokens.length > 0) {
      searchResults = this.performTextSearch(filteredPapers, tokens, query);
    } else {
      // No text query, return all filtered papers
      searchResults = filteredPapers.map(paper => ({
        paper,
        score: 1.0,
        highlights: [],
        matchedFields: []
      }));
    }

    // Sort results
    searchResults = this.sortResults(searchResults, query.sortBy, query.sortOrder);

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedResults = searchResults.slice(offset, offset + limit);

    // Generate facets
    const facets = this.generateFacets(filteredPapers);

    // Generate suggestions
    const suggestions = this.generateSuggestions(normalizedQuery, tokens);

    // Add to search history
    if (normalizedQuery.trim()) {
      this.addToHistory(normalizedQuery);
    }

    const queryTime = Date.now() - startTime;

    return {
      results: paginatedResults,
      total: searchResults.length,
      facets,
      suggestions,
      queryTime
    };
  }

  /**
   * Get search suggestions based on input
   */
  getSuggestions(input: string): string[] {
    const normalizedInput = input.toLowerCase().trim();
    if (normalizedInput.length < 2) return [];

    const suggestions = new Set<string>();

    // Add from search history
    this.searchHistory
      .filter(query => query.toLowerCase().includes(normalizedInput))
      .forEach(query => suggestions.add(query));

    // Add from paper titles
    this.papers
      .filter(paper => paper.title.toLowerCase().includes(normalizedInput))
      .forEach(paper => suggestions.add(paper.title));

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Normalize search query
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\-"]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Tokenize search query
   */
  private tokenize(query: string): string[] {
    // Handle quoted phrases
    const phrases: string[] = [];
    const phraseRegex = /"([^"]+)"/g;
    let match;
    
    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1]);
      query = query.replace(match[0], '');
    }

    // Split remaining words
    const words = query
      .split(' ')
      .filter(word => word.length > 1)
      .filter(word => !this.isStopWord(word));

    return [...phrases, ...words];
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Apply filters to papers
   */
  private applyFilters(papers: Paper[], filters?: SearchFilter): Paper[] {
    if (!filters) return papers;

    return papers.filter(paper => {
      // Author filter
      if (filters.authors && filters.authors.length > 0) {
        const hasMatchingAuthor = filters.authors.some(filterAuthor =>
          paper.authors.some(paperAuthor => 
            paperAuthor.toLowerCase().includes(filterAuthor.toLowerCase())
          )
        );
        if (!hasMatchingAuthor) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          paper.tags.some(paperTag => 
            paperTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const paperDate = new Date(paper.uploadedAt);
        if (filters.dateRange.start && paperDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && paperDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Perform text search on papers
   */
  private performTextSearch(papers: Paper[], tokens: string[], query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];

    for (const paper of papers) {
      const searchFields = this.getSearchFields(paper, query.filters?.contentType);
      const matchResult = this.matchTokens(searchFields, tokens);
      
      if (matchResult.score > 0) {
        results.push({
          paper,
          score: matchResult.score,
          highlights: matchResult.highlights,
          matchedFields: matchResult.matchedFields
        });
      }
    }

    return results;
  }

  /**
   * Get searchable fields from paper
   */
  private getSearchFields(paper: Paper, contentType?: string): Record<string, string> {
    const fields: Record<string, string> = {};

    if (!contentType || contentType === 'all' || contentType === 'title') {
      fields.title = paper.title;
    }
    if (!contentType || contentType === 'all' || contentType === 'abstract') {
      fields.abstract = paper.abstract;
    }
    if (!contentType || contentType === 'all' || contentType === 'content') {
      fields.content = paper.content;
    }

    fields.authors = paper.authors.join(' ');
    fields.tags = paper.tags.join(' ');

    return fields;
  }

  /**
   * Match tokens against search fields
   */
  private matchTokens(searchFields: Record<string, string>, tokens: string[]): {
    score: number;
    highlights: SearchHighlight[];
    matchedFields: string[];
  } {
    let totalScore = 0;
    const highlights: SearchHighlight[] = [];
    const matchedFields: string[] = [];

    const fieldWeights = {
      title: 3.0,
      abstract: 2.0,
      authors: 2.0,
      tags: 1.5,
      content: 1.0
    };

    for (const [fieldName, fieldContent] of Object.entries(searchFields)) {
      const fieldMatches = this.findMatches(fieldContent, tokens);
      
      if (fieldMatches.length > 0) {
        matchedFields.push(fieldName);
        const fieldWeight = fieldWeights[fieldName as keyof typeof fieldWeights] || 1.0;
        
        // Calculate field score based on matches
        const fieldScore = fieldMatches.reduce((sum, match) => sum + match.score, 0);
        totalScore += fieldScore * fieldWeight;

        // Add highlights
        fieldMatches.forEach(match => {
          highlights.push({
            field: fieldName,
            text: match.text,
            start: match.start,
            end: match.end
          });
        });
      }
    }

    return {
      score: totalScore,
      highlights: highlights.slice(0, 5), // Limit highlights
      matchedFields
    };
  }

  /**
   * Find matches for tokens in text
   */
  private findMatches(text: string, tokens: string[]): Array<{
    text: string;
    start: number;
    end: number;
    score: number;
  }> {
    const matches: Array<{
      text: string;
      start: number;
      end: number;
      score: number;
    }> = [];

    const lowerText = text.toLowerCase();

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      let index = 0;

      while ((index = lowerText.indexOf(lowerToken, index)) !== -1) {
        const isWordBoundary = (index === 0 || !/\w/.test(lowerText[index - 1])) &&
                              (index + token.length === lowerText.length || !/\w/.test(lowerText[index + token.length]));
        
        const score = isWordBoundary ? 1.0 : 0.5; // Higher score for exact word matches

        matches.push({
          text: text.substring(index, index + token.length),
          start: index,
          end: index + token.length,
          score
        });

        index += token.length;
      }
    }

    return matches;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sortBy?: string, sortOrder?: string): SearchResult[] {
    const order = sortOrder === 'desc' ? -1 : 1;

    return results.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return order * (new Date(b.paper.uploadedAt).getTime() - new Date(a.paper.uploadedAt).getTime());
        case 'title':
          return order * a.paper.title.localeCompare(b.paper.title);
        case 'author':
          return order * a.paper.authors[0]?.localeCompare(b.paper.authors[0] || '') || 0;
        case 'relevance':
        default:
          return b.score - a.score; // Always descending for relevance
      }
    });
  }

  /**
   * Generate search facets
   */
  private generateFacets(papers: Paper[]): SearchFacets {
    const authorCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const yearCounts = new Map<number, number>();

    papers.forEach(paper => {
      // Count authors
      paper.authors.forEach(author => {
        authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
      });

      // Count tags
      paper.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Count years
      const year = new Date(paper.uploadedAt).getFullYear();
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    });

    return {
      authors: Array.from(authorCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      tags: Array.from(tagCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      years: Array.from(yearCounts.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => b.year - a.year)
    };
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, tokens: string[]): string[] {
    if (tokens.length === 0) return [];

    const suggestions = new Set<string>();

    // Add spelling corrections and related terms
    this.papers.forEach(paper => {
      // Check for similar terms in titles
      const titleWords = paper.title.toLowerCase().split(' ');
      tokens.forEach(token => {
        titleWords.forEach(word => {
          if (word.length > 3 && this.calculateSimilarity(token, word) > 0.7) {
            suggestions.add(word);
          }
        });
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Calculate string similarity
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Add query to search history
   */
  private addToHistory(query: string): void {
    // Remove if already exists
    const index = this.searchHistory.indexOf(query);
    if (index > -1) {
      this.searchHistory.splice(index, 1);
    }

    // Add to beginning
    this.searchHistory.unshift(query);

    // Limit history size
    if (this.searchHistory.length > this.MAX_HISTORY) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY);
    }
  }
}

export const searchEngine = new SearchEngine();
export default searchEngine; 