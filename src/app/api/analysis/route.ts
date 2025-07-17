import { NextRequest, NextResponse } from 'next/server';
import { aiAnalysisService } from '@/lib/ai-analysis-service';
import { ANALYSIS_TYPES, ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperId, content, analysisType } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Paper content is required' },
        { status: 400 }
      );
    }

    if (!analysisType) {
      return NextResponse.json(
        { success: false, error: 'Analysis type is required' },
        { status: 400 }
      );
    }

    let result: any;

    switch (analysisType) {
      case ANALYSIS_TYPES.SUMMARY:
        result = await aiAnalysisService.summarizeDocument(content);
        break;

      case ANALYSIS_TYPES.KEY_FINDINGS:
        result = await aiAnalysisService.extractKeyFindings(content);
        break;

      case ANALYSIS_TYPES.CONCEPTS:
        result = await aiAnalysisService.extractConcepts(content);
        break;

      case 'comprehensive':
        result = await aiAnalysisService.analyzeDocument(content);
        break;

      case 'questions':
        result = await aiAnalysisService.generateQuestions(content);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analysis type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        paperId,
        analysisType,
        result,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Analysis error:', error);
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
  const paperId = searchParams.get('paperId');

  if (!paperId) {
    return NextResponse.json(
      { success: false, error: 'Paper ID is required' },
      { status: 400 }
    );
  }

  // In a real implementation, you would fetch cached analysis results from a database
  // For now, return available analysis types
  return NextResponse.json({
    success: true,
    data: {
      paperId,
      availableAnalyses: Object.values(ANALYSIS_TYPES),
      supportedTypes: [
        {
          type: ANALYSIS_TYPES.SUMMARY,
          name: 'Paper Summary',
          description: 'Comprehensive overview of the paper including objectives, methodology, and findings',
        },
        {
          type: ANALYSIS_TYPES.KEY_FINDINGS,
          name: 'Key Findings',
          description: 'Main research findings and contributions extracted from the paper',
        },
        {
          type: ANALYSIS_TYPES.METHODOLOGY,
          name: 'Methodology Analysis',
          description: 'Detailed explanation of research methods and experimental setup',
        },
        {
          type: ANALYSIS_TYPES.CONCEPTS,
          name: 'Concept Extraction',
          description: 'Key terms, concepts, and technical vocabulary with definitions',
        },
        {
          type: ANALYSIS_TYPES.CITATIONS,
          name: 'Citation Analysis',
          description: 'Analysis of references and academic context of the paper',
        },
      ],
    },
  });
}
