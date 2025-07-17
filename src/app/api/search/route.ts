import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Paper, SearchResult } from '@/lib/types';
import { ERROR_MESSAGES } from '@/lib/constants';

const PAPERS_STORAGE_PATH = join(process.cwd(), 'data', 'papers.json');

async function loadPapers(): Promise<Paper[]> {
  try {
    const data = await readFile(PAPERS_STORAGE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function calculateRelevanceScore(paper: Paper, query: string, filters: any[]): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  // Title match (highest weight)
  if (paper.title.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Author match
  if (paper.authors.some(author => author.toLowerCase().includes(queryLower))) {
    score += 8;
  }

  // Abstract match
  if (paper.abstract.toLowerCase().includes(queryLower)) {
    score += 6;
  }

  // Tag match
  if (paper.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
    score += 5;
  }

  // Content match (if available)
  if (paper.content && paper.content.toLowerCase().includes(queryLower)) {
    score += 3;
  }

  // Apply filter bonuses
  filters.forEach(filter => {
    switch (filter.type) {
      case 'author':
        if (paper.authors.some(author => 
          author.toLowerCase().includes(filter.value.toLowerCase())
        )) {
          score += 15;
        }
        break;
      case 'tag':
        if (paper.tags.some(tag => 
          tag.toLowerCase().includes(filter.value.toLowerCase())
        )) {
          score += 12;
        }
        break;
      case 'year':
        const paperYear = new Date(paper.uploadedAt).getFullYear().toString();
        if (paperYear === filter.value) {
          score += 10;
        }
        break;
    }
  });

  return score;
}

function findMatchedContent(paper: Paper, query: string): string {
  const queryLower = query.toLowerCase();
  
  // Check title first
  if (paper.title.toLowerCase().includes(queryLower)) {
    return paper.title;
  }

  // Check abstract
  if (paper.abstract.toLowerCase().includes(queryLower)) {
    const index = paper.abstract.toLowerCase().indexOf(queryLower);
    const start = Math.max(0, index - 50);
    const end = Math.min(paper.abstract.length, index + query.length + 50);
    return '...' + paper.abstract.slice(start, end) + '...';
  }

  // Check content (if available)
  if (paper.content && paper.content.toLowerCase().includes(queryLower)) {
    const index = paper.content.toLowerCase().indexOf(queryLower);
    const start = Math.max(0, index - 100);
    const end = Math.min(paper.content.length, index + query.length + 100);
    return '...' + paper.content.slice(start, end) + '...';
  }

  return paper.abstract.slice(0, 100) + '...';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const filtersParam = searchParams.get('filters');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filters: any[] = [];
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch {
        filters = [];
      }
    }

    const papers = await loadPapers();

    if (!query && filters.length === 0) {
      // Return all papers if no search query or filters
      const paginatedPapers = papers.slice(offset, offset + limit);
      return NextResponse.json({
        success: true,
        data: {
          results: paginatedPapers.map(paper => ({
            paperId: paper.id,
            title: paper.title,
            relevanceScore: 1,
            matchedContent: paper.abstract.slice(0, 100) + '...',
          })),
          total: papers.length,
          query,
          filters,
          offset,
          limit,
        },
      });
    }

    // Perform search
    const searchResults: SearchResult[] = [];

    papers.forEach(paper => {
      const relevanceScore = calculateRelevanceScore(paper, query, filters);
      
      if (relevanceScore > 0) {
        searchResults.push({
          paperId: paper.id,
          title: paper.title,
          relevanceScore,
          matchedContent: findMatchedContent(paper, query),
        });
      }
    });

    // Sort by relevance score
    searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply pagination
    const paginatedResults = searchResults.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        total: searchResults.length,
        query,
        filters,
        offset,
        limit,
        hasMore: offset + limit < searchResults.length,
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: ERROR_MESSAGES.API_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters = [], options = {} } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const papers = await loadPapers();
    const searchResults: SearchResult[] = [];

    papers.forEach(paper => {
      const relevanceScore = calculateRelevanceScore(paper, query, filters);
      
      if (relevanceScore > 0) {
        searchResults.push({
          paperId: paper.id,
          title: paper.title,
          relevanceScore,
          matchedContent: findMatchedContent(paper, query),
        });
      }
    });

    // Sort by relevance score
    searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply options
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const paginatedResults = searchResults.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        total: searchResults.length,
        query,
        filters,
        options,
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: ERROR_MESSAGES.API_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
