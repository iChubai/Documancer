import { NextRequest, NextResponse } from 'next/server';
import { comparePapers } from '@/lib/langchain';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paper1, paper2 } = body;

    if (!paper1 || !paper2) {
      return NextResponse.json(
        { success: false, error: 'Two papers are required for comparison' },
        { status: 400 }
      );
    }

    if (!paper1.content || !paper2.content) {
      return NextResponse.json(
        { success: false, error: 'Paper content is required for comparison' },
        { status: 400 }
      );
    }

    // Format paper content for comparison
    const paper1Content = `Title: ${paper1.title}\n\nContent: ${paper1.content}`;
    const paper2Content = `Title: ${paper2.title}\n\nContent: ${paper2.content}`;

    // Generate comparison using LangChain
    const comparison = await comparePapers(paper1Content, paper2Content);

    return NextResponse.json({
      success: true,
      data: {
        comparison,
        papers: [
          { id: paper1.id, title: paper1.title },
          { id: paper2.id, title: paper2.title },
        ],
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Comparison error:', error);
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paperIds = searchParams.get('papers')?.split(',');

  if (!paperIds || paperIds.length < 2) {
    return NextResponse.json(
      { success: false, error: 'At least 2 paper IDs are required' },
      { status: 400 }
    );
  }

  // In a real implementation, you would fetch the papers from database
  // and then perform the comparison
  return NextResponse.json({
    success: true,
    data: {
      message: 'Use POST method with paper content for comparison',
      requiredFields: ['paper1', 'paper2'],
      paperIds,
    },
  });
}
