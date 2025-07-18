import { NextRequest, NextResponse } from 'next/server';
import { Annotation } from '@/lib/annotation-types';
import { annotationStorage } from '@/lib/annotation-storage';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * Import annotations for a specific paper
 * POST /api/annotations/import
 */
export async function POST(request: NextRequest) {
  try {
    const { paperId, annotations }: { paperId: string; annotations: Annotation[] } = await request.json();

    // Validate input data
    if (!paperId || !Array.isArray(annotations)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data: paperId and annotations array required' 
        },
        { status: 400 }
      );
    }

    // Import annotations one by one
    const importResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const annotation of annotations) {
      try {
        // Validate annotation structure
        if (!annotation.id || !annotation.content || !annotation.type) {
          errorCount++;
          importResults.push({
            id: annotation.id || 'unknown',
            success: false,
            error: 'Invalid annotation structure'
          });
          continue;
        }

        // Convert dates if they are strings
        const processedAnnotation: Annotation = {
          ...annotation,
          paperId,
          createdAt: new Date(annotation.createdAt),
          updatedAt: new Date(annotation.updatedAt || annotation.createdAt)
        };

        await annotationStorage.saveAnnotation(processedAnnotation);
        successCount++;
        importResults.push({
          id: annotation.id,
          success: true
        });

      } catch (error) {
        errorCount++;
        importResults.push({
          id: annotation.id || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      data: {
        paperId,
        totalAnnotations: annotations.length,
        successCount,
        errorCount,
        results: importResults
      },
      message: `Imported ${successCount} annotations successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
    });

  } catch (error) {
    console.error('Annotation import error:', error);
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