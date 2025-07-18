import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { ReadingSession } from '@/lib/types';
import { ERROR_MESSAGES } from '@/lib/constants';

const SESSIONS_STORAGE_PATH = join(process.cwd(), 'data', 'sessions.json');

/**
 * Import reading sessions
 * POST /api/sessions/import
 */
export async function POST(request: NextRequest) {
  try {
    const sessions: ReadingSession[] = await request.json();

    // Validate input data
    if (!Array.isArray(sessions)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data: sessions array required' 
        },
        { status: 400 }
      );
    }

    // Load existing sessions
    let existingSessions: ReadingSession[] = [];
    try {
      const data = await readFile(SESSIONS_STORAGE_PATH, 'utf-8');
      existingSessions = JSON.parse(data);
    } catch {
      existingSessions = [];
    }

    const importResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const session of sessions) {
      try {
        // Validate session structure
        if (!session.id || !session.paperId) {
          errorCount++;
          importResults.push({
            id: session.id || 'unknown',
            success: false,
            error: 'Invalid session structure: missing id or paperId'
          });
          continue;
        }

        // Check for duplicates
        const existingSession = existingSessions.find(s => s.id === session.id);
        if (existingSession) {
          errorCount++;
          importResults.push({
            id: session.id,
            success: false,
            error: 'Session already exists'
          });
          continue;
        }

        // Process session dates
        const processedSession: ReadingSession = {
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        };

        existingSessions.push(processedSession);
        successCount++;
        importResults.push({
          id: session.id,
          success: true
        });

      } catch (error) {
        errorCount++;
        importResults.push({
          id: session.id || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Save updated sessions
    await writeFile(SESSIONS_STORAGE_PATH, JSON.stringify(existingSessions, null, 2));

    return NextResponse.json({
      success: errorCount === 0,
      data: {
        totalSessions: sessions.length,
        successCount,
        errorCount,
        results: importResults
      },
      message: `Imported ${successCount} sessions successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
    });

  } catch (error) {
    console.error('Sessions import error:', error);
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