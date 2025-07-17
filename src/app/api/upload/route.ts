import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { PDFProcessor } from '@/lib/pdf-processor';
import { Paper } from '@/lib/types';
import { APP_CONFIG, ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > APP_CONFIG.maxFileSize) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FILE_TOO_LARGE },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate PDF format
    const isValidPDF = await PDFProcessor.validatePDF(buffer);
    if (!isValidPDF) {
      return NextResponse.json(
        { success: false, error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // Process PDF
    const processingResult = await PDFProcessor.processPDF(buffer);
    const paperMetadata = PDFProcessor.extractPaperMetadata(processingResult.text, file.name);

    // Create paper object
    const paper: Paper = {
      id: `paper_${timestamp}`,
      title: paperMetadata.title || file.name.replace('.pdf', ''),
      authors: paperMetadata.authors || ['Unknown Author'],
      abstract: paperMetadata.abstract || 'No abstract available',
      content: processingResult.text,
      filePath: `/api/files/${filename}`, // Use API endpoint for file access
      uploadedAt: new Date(),
      lastAccessedAt: new Date(),
      tags: paperMetadata.tags || [],
    };

    // Save paper to storage
    try {
      const dataDir = join(process.cwd(), 'data');
      const papersFile = join(dataDir, 'papers.json');

      // Ensure data directory exists
      if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true });
      }

      // Load existing papers
      let papers: Paper[] = [];
      if (existsSync(papersFile)) {
        const data = await readFile(papersFile, 'utf-8');
        papers = JSON.parse(data);
      }

      // Add new paper
      papers.push(paper);

      // Save updated papers
      await writeFile(papersFile, JSON.stringify(papers, null, 2));
    } catch (error) {
      console.error('Error saving paper to storage:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        paper,
        metadata: processingResult.metadata,
        pages: processingResult.pages.length,
      },
      message: 'File uploaded and processed successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: ERROR_MESSAGES.UPLOAD_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Use POST to upload files.' 
    },
    { status: 405 }
  );
}
