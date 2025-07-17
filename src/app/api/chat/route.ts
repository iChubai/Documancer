import { NextRequest, NextResponse } from 'next/server';
import { aiAnalysisService } from '@/lib/ai-analysis-service';
import { ChatMessage } from '@/lib/types';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, paperId, paperContent, context } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!paperContent) {
      return NextResponse.json(
        { success: false, error: 'Paper content is required for analysis' },
        { status: 400 }
      );
    }

    // Generate response using AI service
    const answerResult = await aiAnalysisService.answerQuestion(paperContent, message);
    const response = answerResult.answer;

    // Create response message
    const responseMessage: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      paperId,
      context,
    };

    return NextResponse.json({
      success: true,
      data: {
        message: responseMessage,
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
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

// Handle streaming responses for real-time chat
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');
  const paperContent = searchParams.get('content');

  if (!message || !paperContent) {
    return NextResponse.json(
      { success: false, error: 'Message and content are required' },
      { status: 400 }
    );
  }

  try {
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const answerResult = await aiAnalysisService.answerQuestion(paperContent, message);
          const response = answerResult.answer;
          
          // Simulate streaming by sending chunks
          const chunks = response.split(' ');
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i] + (i < chunks.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            
            // Add small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Streaming chat error:', error);
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
