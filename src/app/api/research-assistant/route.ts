import { NextRequest, NextResponse } from 'next/server';
import { createDeepSeekModel } from '@/lib/langchain';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Research Assistant prompt template
const RESEARCH_ASSISTANT_PROMPT = PromptTemplate.fromTemplate(`
You are an expert research assistant with deep knowledge across multiple academic disciplines.
You help researchers with methodology, literature review, data analysis, academic writing, and research planning.

User Question: {question}

Please provide a comprehensive, helpful response that includes:
1. Direct answer to the question
2. Practical recommendations and best practices
3. Relevant examples or case studies when applicable
4. Additional resources or next steps to consider

Keep your response informative but concise, and structure it clearly for easy understanding.
Focus on actionable advice that the researcher can implement immediately.

Response:
`);

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Create DeepSeek model instance
    const model = createDeepSeekModel();
    
    // Create the chain
    const chain = RunnableSequence.from([
      RESEARCH_ASSISTANT_PROMPT,
      model,
      new StringOutputParser(),
    ]);

    // Get response from AI
    const response = await chain.invoke({
      question: question,
    });

    // Generate tags based on question content
    const tags = generateTags(question);

    return NextResponse.json({
      success: true,
      answer: response,
      tags: tags,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Research Assistant API error:', error);
    return NextResponse.json(
      { error: 'Failed to get research assistance' },
      { status: 500 }
    );
  }
}

// Helper function to generate relevant tags based on question content
function generateTags(question: string): string[] {
  const tags: string[] = [];
  const lowerQuestion = question.toLowerCase();

  // Research methodology tags
  if (lowerQuestion.includes('methodology') || lowerQuestion.includes('method')) {
    tags.push('methodology');
  }
  if (lowerQuestion.includes('literature review') || lowerQuestion.includes('systematic review')) {
    tags.push('literature-review');
  }
  if (lowerQuestion.includes('data analysis') || lowerQuestion.includes('statistical')) {
    tags.push('data-analysis');
  }
  if (lowerQuestion.includes('writing') || lowerQuestion.includes('academic writing')) {
    tags.push('academic-writing');
  }
  if (lowerQuestion.includes('research question') || lowerQuestion.includes('hypothesis')) {
    tags.push('research-design');
  }
  if (lowerQuestion.includes('citation') || lowerQuestion.includes('reference')) {
    tags.push('citations');
  }
  if (lowerQuestion.includes('experiment') || lowerQuestion.includes('experimental')) {
    tags.push('experimental-design');
  }
  if (lowerQuestion.includes('survey') || lowerQuestion.includes('questionnaire')) {
    tags.push('survey-research');
  }
  if (lowerQuestion.includes('interview') || lowerQuestion.includes('qualitative')) {
    tags.push('qualitative-research');
  }
  if (lowerQuestion.includes('quantitative') || lowerQuestion.includes('statistical')) {
    tags.push('quantitative-research');
  }

  // Default tags if no specific ones found
  if (tags.length === 0) {
    tags.push('research', 'general');
  }

  return tags;
}
