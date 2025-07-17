import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Initialize DeepSeek model (using OpenAI-compatible API)
export const createDeepSeekModel = () => {
  return new ChatOpenAI({
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    },
    temperature: 0.1,
    maxTokens: 4000,
  });
};

// Enhanced prompt templates for comprehensive analysis
export const PROMPTS = {
  COMPREHENSIVE_ANALYSIS: PromptTemplate.fromTemplate(`
    You are an expert academic paper analyst with deep knowledge across multiple research domains.
    Analyze the following research paper comprehensively and provide detailed insights.

    Paper Content:
    {content}

    Please provide a thorough analysis in the following structured format:

    ## EXECUTIVE SUMMARY
    - Provide a 3-4 sentence summary of the paper's core contribution
    - State the main research question and hypothesis

    ## KEY FINDINGS
    - List 5-7 most significant findings with brief explanations
    - Include quantitative results where available
    - Highlight novel discoveries or insights

    ## METHODOLOGY ANALYSIS
    - Describe the research approach and experimental design
    - Evaluate the appropriateness of methods used
    - Identify any methodological innovations or limitations

    ## MAIN CONTRIBUTIONS
    - List theoretical contributions to the field
    - Identify practical applications and implications
    - Note any new frameworks, models, or algorithms introduced

    ## CRITICAL ANALYSIS
    ### Strengths:
    - What are the paper's strongest points?
    - What makes this research valuable?

    ### Weaknesses:
    - What are potential limitations or gaps?
    - What could be improved?

    ### Implications:
    - How does this work advance the field?
    - What are the broader implications?

    ## TECHNICAL DETAILS
    ### Algorithms/Methods:
    - List key algorithms or computational methods

    ### Datasets:
    - Identify datasets used for experiments

    ### Evaluation Metrics:
    - List performance metrics and evaluation criteria

    ### Tools/Technologies:
    - Note software, frameworks, or tools mentioned

    ## CITATIONS AND REFERENCES
    - Identify 3-5 most important references cited
    - Note influential authors or research groups mentioned
    - Estimate the paper's position in the research landscape

    Be thorough, accurate, and provide specific details from the paper.
  `),

  EXTRACT_CONCEPTS: PromptTemplate.fromTemplate(`
    Extract and analyze key concepts, terminology, and technical terms from this research paper.

    Paper Content:
    {content}

    For each important concept, provide:
    1. The term/concept name
    2. A clear definition or explanation
    3. Its importance level (high/medium/low)
    4. Related concepts or dependencies
    5. Context within the paper

    Focus on:
    - Technical terminology
    - Theoretical concepts
    - Methodological approaches
    - Domain-specific terms
    - Novel concepts introduced

    Format as a structured list with explanations.
  `),

  EXPLAIN_METHODOLOGY: PromptTemplate.fromTemplate(`
    Analyze the methodology section of this research paper and provide a clear explanation.

    Paper Content:
    {content}

    Please explain:
    1. Research design and approach
    2. Data collection methods
    3. Analysis techniques used
    4. Tools and technologies employed
    5. Experimental setup (if applicable)
    6. Validation methods
    7. Limitations of the methodology

    Make the explanation accessible to researchers in related fields.
  `),

  GENERATE_QUESTIONS: PromptTemplate.fromTemplate(`
    Generate thoughtful questions about this research paper that would help readers better understand the work.

    Paper Content:
    {content}

    Generate 8-10 questions covering:
    1. Clarification questions about methodology
    2. Questions about implications and applications
    3. Questions about limitations and future work
    4. Questions comparing to related work
    5. Questions about technical details

    Format as a numbered list with clear, specific questions.
  `),

  SUMMARIZE: PromptTemplate.fromTemplate(`
    Provide a concise summary of this research paper.

    Paper Content:
    {content}

    Include:
    1. Main research question and objectives
    2. Key methodology
    3. Primary findings
    4. Significance and implications

    Keep it concise but comprehensive.
  `),

  EXTRACT_KEY_FINDINGS: PromptTemplate.fromTemplate(`
    Extract the key findings and contributions from this research paper.

    Paper Content:
    {content}

    List:
    1. Main research findings
    2. Novel contributions
    3. Experimental results
    4. Theoretical insights
    5. Practical applications

    Be specific and detailed.
  `),

  ANSWER_QUESTION: PromptTemplate.fromTemplate(`
    You are an AI assistant helping researchers understand academic papers. Answer the following question based on the paper content provided.

    Paper Content:
    {content}

    Question: {question}

    Please provide a comprehensive answer that:
    1. Directly addresses the question
    2. References specific sections of the paper when relevant
    3. Provides context and background if needed
    4. Mentions any limitations or uncertainties
    5. Suggests related questions or areas for further exploration

    If the question cannot be answered from the provided content, clearly state this and explain why.
  `),

  COMPARE_PAPERS: PromptTemplate.fromTemplate(`
    Compare and analyze the following research papers. Identify similarities, differences, and relationships between them.

    Paper 1:
    {paper1}

    Paper 2:
    {paper2}

    Please provide:
    1. Common themes and research areas
    2. Methodological similarities and differences
    3. Complementary findings or conflicting results
    4. How the papers build upon or relate to each other
    5. Gaps that could be addressed by combining insights
    6. Recommendations for researchers interested in this area

    Structure your comparison clearly with specific examples from both papers.
  `),

  ANALYZE_CITATIONS: PromptTemplate.fromTemplate(`
    Analyze the citations and references in this research paper to understand its academic context.

    Paper Content:
    {content}

    Please identify:
    1. Key foundational works cited
    2. Recent developments referenced
    3. Main research communities or schools of thought
    4. Gaps in the literature identified by the authors
    5. How this work positions itself relative to existing research
    6. Potential future research directions suggested

    Focus on understanding the academic landscape and research trajectory.
  `),
};

// Create analysis chains
export const createAnalysisChain = (promptTemplate: PromptTemplate) => {
  const model = createDeepSeekModel();
  const outputParser = new StringOutputParser();

  return RunnableSequence.from([
    promptTemplate,
    model,
    outputParser,
  ]);
};

// Specific analysis functions
export const summarizePaper = async (content: string) => {
  const chain = createAnalysisChain(PROMPTS.SUMMARIZE);
  return await chain.invoke({ content });
};

export const extractKeyFindings = async (content: string) => {
  const chain = createAnalysisChain(PROMPTS.EXTRACT_KEY_FINDINGS);
  return await chain.invoke({ content });
};

export const explainMethodology = async (content: string) => {
  const chain = createAnalysisChain(PROMPTS.EXPLAIN_METHODOLOGY);
  return await chain.invoke({ content });
};

export const extractConcepts = async (content: string) => {
  const chain = createAnalysisChain(PROMPTS.EXTRACT_CONCEPTS);
  return await chain.invoke({ content });
};

export const answerQuestion = async (content: string, question: string) => {
  const chain = createAnalysisChain(PROMPTS.ANSWER_QUESTION);
  return await chain.invoke({ content, question });
};

export const comparePapers = async (paper1: string, paper2: string) => {
  const chain = createAnalysisChain(PROMPTS.COMPARE_PAPERS);
  return await chain.invoke({ paper1, paper2 });
};

export const analyzeCitations = async (content: string) => {
  const chain = createAnalysisChain(PROMPTS.ANALYZE_CITATIONS);
  return await chain.invoke({ content });
};
