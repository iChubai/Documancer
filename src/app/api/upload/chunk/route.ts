import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const UPLOAD_SESSIONS_PATH = join(process.cwd(), 'data', 'upload-sessions.json');
const TEMP_UPLOAD_DIR = join(process.cwd(), 'uploads', 'temp');

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
 * Handle individual chunk upload
 * POST /api/upload/chunk
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const chunk = formData.get('chunk') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const sessionId = formData.get('sessionId') as string;
    const start = parseInt(formData.get('start') as string);
    const end = parseInt(formData.get('end') as string);

    // Validate input
    if (!chunk || isNaN(chunkIndex) || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
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
    const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = sessions[sessionIndex];

    // Check if chunk already uploaded
    if (session.uploadedChunks.includes(chunkIndex)) {
      return NextResponse.json({
        success: true,
        message: 'Chunk already uploaded',
        chunkIndex,
        duplicate: true
      });
    }

    // Save chunk to file
    const chunkPath = join(TEMP_UPLOAD_DIR, sessionId, `chunk_${chunkIndex.toString().padStart(6, '0')}`);
    const chunkBuffer = await chunk.arrayBuffer();
    await writeFile(chunkPath, Buffer.from(chunkBuffer));

    // Update session
    session.uploadedChunks.push(chunkIndex);
    session.uploadedChunks.sort((a, b) => a - b);
    session.lastActivityAt = new Date();
    sessions[sessionIndex] = session;

    // Save updated sessions
    await writeFile(UPLOAD_SESSIONS_PATH, JSON.stringify(sessions, null, 2));

    const progress = {
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      percentage: (session.uploadedChunks.length / session.totalChunks) * 100,
      isComplete: session.uploadedChunks.length === session.totalChunks
    };

    return NextResponse.json({
      success: true,
      data: {
        chunkIndex,
        progress,
        sessionId
      },
      message: `Chunk ${chunkIndex} uploaded successfully`
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload chunk',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 