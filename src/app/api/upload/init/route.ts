import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface UploadSession {
  sessionId: string;
  filename: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: Date;
  lastActivityAt: Date;
}

const UPLOAD_SESSIONS_PATH = join(process.cwd(), 'data', 'upload-sessions.json');
const TEMP_UPLOAD_DIR = join(process.cwd(), 'uploads', 'temp');

/**
 * Initialize chunked upload session
 * POST /api/upload/init
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, filename, fileSize, totalChunks } = await request.json();

    // Validate input
    if (!sessionId || !filename || !fileSize || !totalChunks) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Ensure directories exist
    if (!existsSync(join(process.cwd(), 'data'))) {
      await mkdir(join(process.cwd(), 'data'), { recursive: true });
    }
    if (!existsSync(TEMP_UPLOAD_DIR)) {
      await mkdir(TEMP_UPLOAD_DIR, { recursive: true });
    }

    // Load existing sessions
    let sessions: UploadSession[] = [];
    try {
      const data = await readFile(UPLOAD_SESSIONS_PATH, 'utf-8');
      sessions = JSON.parse(data);
    } catch {
      sessions = [];
    }

    // Check if session already exists
    const existingSession = sessions.find(s => s.sessionId === sessionId);
    if (existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session already exists' },
        { status: 409 }
      );
    }

    // Create new session
    const newSession: UploadSession = {
      sessionId,
      filename,
      fileSize,
      totalChunks,
      uploadedChunks: [],
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    sessions.push(newSession);

    // Save sessions
    await writeFile(UPLOAD_SESSIONS_PATH, JSON.stringify(sessions, null, 2));

    // Create session directory
    const sessionDir = join(TEMP_UPLOAD_DIR, sessionId);
    await mkdir(sessionDir, { recursive: true });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        chunkSize: 2 * 1024 * 1024, // 2MB
        uploadedChunks: []
      },
      message: 'Upload session initialized'
    });

  } catch (error) {
    console.error('Upload init error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize upload session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 