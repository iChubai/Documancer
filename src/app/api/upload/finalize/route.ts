import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir, unlink, rmdir } from 'fs/promises';
import { join } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { PDFProcessor } from '@/lib/pdf-processor';
import { Paper } from '@/lib/types';

const UPLOAD_SESSIONS_PATH = join(process.cwd(), 'data', 'upload-sessions.json');
const TEMP_UPLOAD_DIR = join(process.cwd(), 'uploads', 'temp');
const FINAL_UPLOAD_DIR = join(process.cwd(), 'uploads');
const PAPERS_STORAGE_PATH = join(process.cwd(), 'data', 'papers.json');

interface UploadSession {
  sessionId: string;
  filename: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Finalize chunked upload by merging chunks and processing file
 * POST /api/upload/finalize
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Load sessions
    let sessions: UploadSession[] = [];
    try {
      const data = await readFile(UPLOAD_SESSIONS_PATH, 'utf-8');
      sessions = JSON.parse(data);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Find session
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify all chunks uploaded
    if (session.uploadedChunks.length !== session.totalChunks) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Incomplete upload: ${session.uploadedChunks.length}/${session.totalChunks} chunks` 
        },
        { status: 400 }
      );
    }

    // Merge chunks
    const mergedFilePath = await mergeChunks(sessionId, session);
    
    // Process the merged file
    const processingResult = await processUploadedFile(mergedFilePath, session.filename);
    
    // Create paper object
    const timestamp = Date.now();
    const paper: Paper = {
      id: `paper_${timestamp}`,
      title: processingResult.metadata.title || session.filename.replace('.pdf', ''),
      authors: processingResult.metadata.author ? [processingResult.metadata.author] : ['Unknown Author'],
      abstract: extractAbstract(processingResult.text) || 'No abstract available',
      content: processingResult.text,
      filePath: `/api/files/${session.filename}`,
      uploadedAt: new Date(),
      lastAccessedAt: new Date(),
      tags: extractTags(processingResult.text),
    };

    // Save paper to storage
    await savePaperToStorage(paper);

    // Cleanup temporary files
    await cleanupSession(sessionId);

    // Remove session from active sessions
    const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
    await writeFile(UPLOAD_SESSIONS_PATH, JSON.stringify(updatedSessions, null, 2));

    return NextResponse.json({
      success: true,
      data: {
        paper,
        metadata: processingResult.metadata,
        pages: processingResult.pages?.length || 0,
        processingTime: processingResult.processingTime
      },
      message: 'File uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Upload finalize error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to finalize upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Merge uploaded chunks into a single file
 */
async function mergeChunks(sessionId: string, session: UploadSession): Promise<string> {
  const sessionDir = join(TEMP_UPLOAD_DIR, sessionId);
  const outputPath = join(FINAL_UPLOAD_DIR, session.filename);
  
  // Create write stream for merged file
  const writeStream = createWriteStream(outputPath);
  
  try {
    // Read and write chunks in order
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = join(sessionDir, `chunk_${i.toString().padStart(6, '0')}`);
      const readStream = createReadStream(chunkPath);
      
      // Pipe chunk to output file
      await pipeline(readStream, writeStream, { end: false });
    }
    
    // Close the write stream
    writeStream.end();
    
    return outputPath;
    
  } catch (error) {
    writeStream.destroy();
    throw new Error(`Failed to merge chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process uploaded PDF file
 */
async function processUploadedFile(filePath: string, filename: string) {
  const startTime = Date.now();
  
  try {
    // Read file buffer
    const fileBuffer = await readFile(filePath);
    
    // Process with PDF processor
    const result = await PDFProcessor.processPDF(fileBuffer);
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...result,
      processingTime
    };
    
  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save paper to storage
 */
async function savePaperToStorage(paper: Paper): Promise<void> {
  try {
    // Load existing papers
    let papers: Paper[] = [];
    try {
      const data = await readFile(PAPERS_STORAGE_PATH, 'utf-8');
      papers = JSON.parse(data);
    } catch {
      papers = [];
    }

    // Add new paper
    papers.push(paper);

    // Save updated papers
    await writeFile(PAPERS_STORAGE_PATH, JSON.stringify(papers, null, 2));
    
  } catch (error) {
    throw new Error(`Failed to save paper: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleanup temporary session files
 */
async function cleanupSession(sessionId: string): Promise<void> {
  try {
    const sessionDir = join(TEMP_UPLOAD_DIR, sessionId);
    
    // Read all files in session directory
    const files = await readdir(sessionDir);
    
    // Delete all chunk files
    for (const file of files) {
      await unlink(join(sessionDir, file));
    }
    
    // Remove session directory
    await rmdir(sessionDir);
    
  } catch (error) {
    console.error('Cleanup error:', error);
    // Non-fatal error, continue execution
  }
}

/**
 * Extract abstract from paper text
 */
function extractAbstract(text: string): string | null {
  // Look for abstract section
  const abstractRegex = /abstract[:\s]*\n?([^]*?)(?=\n\s*(?:introduction|keywords|1\.|i\.|conclusion)|$)/i;
  const match = text.match(abstractRegex);
  
  if (match && match[1]) {
    return match[1].trim().substring(0, 500); // Limit to 500 characters
  }
  
  // Fallback: use first paragraph if no abstract found
  const firstParagraph = text.split('\n').find(line => line.trim().length > 50);
  return firstParagraph ? firstParagraph.trim().substring(0, 300) : null;
}

/**
 * Extract tags from paper text
 */
function extractTags(text: string): string[] {
  const tags: Set<string> = new Set();
  
  // Look for keywords section
  const keywordsRegex = /keywords[:\s]*([^]*?)(?=\n\s*(?:introduction|abstract|1\.|i\.)|$)/i;
  const match = text.match(keywordsRegex);
  
  if (match && match[1]) {
    const keywords = match[1]
      .split(/[,;]/)
      .map(k => k.trim())
      .filter(k => k.length > 2 && k.length < 20);
    
    keywords.forEach(k => tags.add(k));
  }
  
  // Extract common academic terms
  const commonTerms = [
    'machine learning', 'artificial intelligence', 'deep learning', 'neural network',
    'algorithm', 'optimization', 'analysis', 'methodology', 'framework',
    'evaluation', 'performance', 'model', 'system', 'approach'
  ];
  
  const lowerText = text.toLowerCase();
  commonTerms.forEach(term => {
    if (lowerText.includes(term)) {
      tags.add(term);
    }
  });
  
  return Array.from(tags).slice(0, 10); // Limit to 10 tags
} 