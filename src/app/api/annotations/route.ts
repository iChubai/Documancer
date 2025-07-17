import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Annotation, AnnotationGroup } from '@/lib/annotation-types';

const ANNOTATIONS_DIR = join(process.cwd(), 'data', 'annotations');

// Ensure annotations directory exists
async function ensureAnnotationsDir() {
  if (!existsSync(ANNOTATIONS_DIR)) {
    await mkdir(ANNOTATIONS_DIR, { recursive: true });
  }
}

// Get annotations file path for a paper
function getAnnotationsFilePath(paperId: string): string {
  return join(ANNOTATIONS_DIR, `${paperId}.json`);
}

// Load annotations for a paper
async function loadAnnotations(paperId: string): Promise<Annotation[]> {
  const filePath = getAnnotationsFilePath(paperId);
  
  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const data = await readFile(filePath, 'utf-8');
    const group: AnnotationGroup = JSON.parse(data);
    return group.annotations || [];
  } catch (error) {
    console.error('Failed to load annotations:', error);
    return [];
  }
}

// Save annotations for a paper
async function saveAnnotations(paperId: string, annotations: Annotation[]): Promise<void> {
  await ensureAnnotationsDir();
  
  const group: AnnotationGroup = {
    paperId,
    annotations,
    lastModified: new Date(),
  };

  const filePath = getAnnotationsFilePath(paperId);
  await writeFile(filePath, JSON.stringify(group, null, 2));
}

// GET /api/annotations?paperId=xxx - Get all annotations for a paper
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');

    if (!paperId) {
      return NextResponse.json(
        { success: false, error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    const annotations = await loadAnnotations(paperId);

    return NextResponse.json({
      success: true,
      data: annotations,
    });
  } catch (error) {
    console.error('Failed to get annotations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load annotations' },
      { status: 500 }
    );
  }
}

// POST /api/annotations - Create or update an annotation
export async function POST(request: NextRequest) {
  try {
    const annotation: Annotation = await request.json();

    if (!annotation.paperId || !annotation.id) {
      return NextResponse.json(
        { success: false, error: 'Paper ID and annotation ID are required' },
        { status: 400 }
      );
    }

    // Load existing annotations
    const annotations = await loadAnnotations(annotation.paperId);

    // Find existing annotation or add new one
    const existingIndex = annotations.findIndex(a => a.id === annotation.id);
    
    if (existingIndex >= 0) {
      // Update existing annotation
      annotations[existingIndex] = {
        ...annotation,
        updatedAt: new Date(),
      };
    } else {
      // Add new annotation
      annotations.push({
        ...annotation,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Save annotations
    await saveAnnotations(annotation.paperId, annotations);

    return NextResponse.json({
      success: true,
      data: annotation,
    });
  } catch (error) {
    console.error('Failed to save annotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save annotation' },
      { status: 500 }
    );
  }
}

// PUT /api/annotations - Update an annotation
export async function PUT(request: NextRequest) {
  return POST(request); // Same logic as POST for upsert
}

// DELETE /api/annotations?paperId=xxx&annotationId=xxx - Delete an annotation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const annotationId = searchParams.get('annotationId');

    if (!paperId || !annotationId) {
      return NextResponse.json(
        { success: false, error: 'Paper ID and annotation ID are required' },
        { status: 400 }
      );
    }

    // Load existing annotations
    const annotations = await loadAnnotations(paperId);

    // Filter out the annotation to delete
    const filteredAnnotations = annotations.filter(a => a.id !== annotationId);

    if (filteredAnnotations.length === annotations.length) {
      return NextResponse.json(
        { success: false, error: 'Annotation not found' },
        { status: 404 }
      );
    }

    // Save updated annotations
    await saveAnnotations(paperId, filteredAnnotations);

    return NextResponse.json({
      success: true,
      message: 'Annotation deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete annotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
