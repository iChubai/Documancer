import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { Paper } from '@/lib/types';
import { ERROR_MESSAGES } from '@/lib/constants';

// In a real application, you would use a database
// For this demo, we'll simulate with file system operations
const PAPERS_STORAGE_PATH = join(process.cwd(), 'data', 'papers.json');

async function loadPapers(): Promise<Paper[]> {
  try {
    const data = await readFile(PAPERS_STORAGE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function savePapers(papers: Paper[]): Promise<void> {
  try {
    const dir = join(process.cwd(), 'data');
    await readdir(dir).catch(() => {
      // Directory doesn't exist, create it
      require('fs').mkdirSync(dir, { recursive: true });
    });
    
    await require('fs').promises.writeFile(
      PAPERS_STORAGE_PATH, 
      JSON.stringify(papers, null, 2)
    );
  } catch (error) {
    console.error('Error saving papers:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const papers = await loadPapers();

    if (paperId) {
      // Get specific paper
      const paper = papers.find(p => p.id === paperId);
      if (!paper) {
        return NextResponse.json(
          { success: false, error: 'Paper not found' },
          { status: 404 }
        );
      }
      
      // Update last accessed time
      paper.lastAccessedAt = new Date();
      await savePapers(papers);
      
      return NextResponse.json({
        success: true,
        data: paper,
      });
    }

    // Filter papers based on search query
    let filteredPapers = papers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPapers = papers.filter(paper => 
        paper.title.toLowerCase().includes(searchLower) ||
        paper.authors.some(author => author.toLowerCase().includes(searchLower)) ||
        paper.abstract.toLowerCase().includes(searchLower) ||
        paper.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by last accessed (most recent first)
    filteredPapers.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );

    // Apply pagination
    const paginatedPapers = filteredPapers.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        papers: paginatedPapers,
        total: filteredPapers.length,
        offset,
        limit,
        hasMore: offset + limit < filteredPapers.length,
      },
    });

  } catch (error) {
    console.error('Error fetching papers:', error);
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
    const paper: Paper = body;

    if (!paper.id || !paper.title) {
      return NextResponse.json(
        { success: false, error: 'Paper ID and title are required' },
        { status: 400 }
      );
    }

    const papers = await loadPapers();
    
    // Check if paper already exists
    const existingIndex = papers.findIndex(p => p.id === paper.id);
    if (existingIndex >= 0) {
      // Update existing paper
      papers[existingIndex] = { ...papers[existingIndex], ...paper };
    } else {
      // Add new paper
      papers.push(paper);
    }

    await savePapers(papers);

    return NextResponse.json({
      success: true,
      data: paper,
      message: existingIndex >= 0 ? 'Paper updated successfully' : 'Paper added successfully',
    });

  } catch (error) {
    console.error('Error saving paper:', error);
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('id');

    if (!paperId) {
      return NextResponse.json(
        { success: false, error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    const papers = await loadPapers();
    const paperIndex = papers.findIndex(p => p.id === paperId);

    if (paperIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Remove paper from array
    const deletedPaper = papers.splice(paperIndex, 1)[0];
    await savePapers(papers);

    // In a real implementation, you might also want to delete the associated file
    // and clean up any related data

    return NextResponse.json({
      success: true,
      data: deletedPaper,
      message: 'Paper deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting paper:', error);
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
