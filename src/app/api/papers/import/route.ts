import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { Paper } from '@/lib/types';
import { ERROR_MESSAGES } from '@/lib/constants';

const PAPERS_STORAGE_PATH = join(process.cwd(), 'data', 'papers.json');

/**
 * Import papers from external data
 * POST /api/papers/import
 */
export async function POST(request: NextRequest) {
  try {
    const paper: Paper = await request.json();

    // Validate paper data
    if (!paper.id || !paper.title || !paper.content) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid paper data: missing required fields' 
        },
        { status: 400 }
      );
    }

    // Load existing papers
    let papers: Paper[] = [];
    try {
      const data = await readFile(PAPERS_STORAGE_PATH, 'utf-8');
      papers = JSON.parse(data);
    } catch {
      papers = [];
    }

    // Check for duplicates
    const existingPaper = papers.find(p => p.id === paper.id);
    if (existingPaper) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Paper already exists',
          paperId: paper.id 
        },
        { status: 409 }
      );
    }

    // Add imported paper
    papers.push({
      ...paper,
      uploadedAt: paper.uploadedAt ? new Date(paper.uploadedAt) : new Date(),
      lastAccessedAt: new Date()
    });

    // Save updated papers
    await writeFile(PAPERS_STORAGE_PATH, JSON.stringify(papers, null, 2));

    return NextResponse.json({
      success: true,
      data: paper,
      message: 'Paper imported successfully'
    });

  } catch (error) {
    console.error('Paper import error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: ERROR_MESSAGES.IMPORT_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 