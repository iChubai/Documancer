import { createDeepSeekModel, PROMPTS, createAnalysisChain } from './langchain';

export interface ComprehensiveAnalysis {
  summary: string;
  keyFindings: string[];
  methodology: string;
  mainContributions: string[];
  criticalAnalysis: {
    strengths: string[];
    weaknesses: string[];
    limitations: string[];
    implications: string[];
  };
  technicalDetails: {
    algorithms: string[];
    datasets: string[];
    metrics: string[];
    tools: string[];
  };
  citations: {
    keyReferences: string[];
    citationCount: number;
    referencedAuthors: string[];
  };
  concepts: ConceptExtraction[];
  questions: string[];
  relatedTopics: string[];
}

export interface ConceptExtraction {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
  relatedTerms: string[];
  context: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources: string[];
}

class AIAnalysisService {
  private model = createDeepSeekModel();

  async analyzeDocument(content: string): Promise<ComprehensiveAnalysis> {
    try {
      console.log('Starting comprehensive document analysis...');
      
      // Run comprehensive analysis
      const comprehensiveChain = createAnalysisChain(PROMPTS.COMPREHENSIVE_ANALYSIS);
      const comprehensiveResult = await comprehensiveChain.invoke({ content });
      
      // Parse the comprehensive analysis result
      const analysis = this.parseComprehensiveAnalysis(comprehensiveResult);
      
      // Extract concepts separately for better accuracy
      const concepts = await this.extractConcepts(content);
      
      // Generate questions
      const questions = await this.generateQuestions(content);
      
      return {
        ...analysis,
        concepts,
        questions,
      };
    } catch (error) {
      console.error('Error in document analysis:', error);
      throw new Error('Failed to analyze document');
    }
  }

  async extractConcepts(content: string): Promise<ConceptExtraction[]> {
    try {
      const conceptChain = createAnalysisChain(PROMPTS.EXTRACT_CONCEPTS);
      const result = await conceptChain.invoke({ content });
      
      return this.parseConceptsResult(result);
    } catch (error) {
      console.error('Error extracting concepts:', error);
      return [];
    }
  }

  async generateQuestions(content: string): Promise<string[]> {
    try {
      const questionChain = createAnalysisChain(PROMPTS.GENERATE_QUESTIONS);
      const result = await questionChain.invoke({ content });
      
      return this.parseQuestionsResult(result);
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  }

  async answerQuestion(content: string, question: string): Promise<QuestionAnswer> {
    try {
      const answerChain = createAnalysisChain(PROMPTS.ANSWER_QUESTION);
      const result = await answerChain.invoke({ content, question });
      
      return {
        question,
        answer: result,
        confidence: 0.8, // This would be calculated based on model confidence
        sources: [], // This would be extracted from the content
      };
    } catch (error) {
      console.error('Error answering question:', error);
      throw new Error('Failed to answer question');
    }
  }

  async summarizeDocument(content: string): Promise<string> {
    try {
      const summaryChain = createAnalysisChain(PROMPTS.SUMMARIZE);
      return await summaryChain.invoke({ content });
    } catch (error) {
      console.error('Error summarizing document:', error);
      throw new Error('Failed to summarize document');
    }
  }

  async extractKeyFindings(content: string): Promise<string[]> {
    try {
      const findingsChain = createAnalysisChain(PROMPTS.EXTRACT_KEY_FINDINGS);
      const result = await findingsChain.invoke({ content });
      
      return this.parseListResult(result);
    } catch (error) {
      console.error('Error extracting key findings:', error);
      return [];
    }
  }

  private parseComprehensiveAnalysis(result: string): Partial<ComprehensiveAnalysis> {
    const analysis: Partial<ComprehensiveAnalysis> = {
      summary: '',
      keyFindings: [],
      methodology: '',
      mainContributions: [],
      criticalAnalysis: {
        strengths: [],
        weaknesses: [],
        limitations: [],
        implications: [],
      },
      technicalDetails: {
        algorithms: [],
        datasets: [],
        metrics: [],
        tools: [],
      },
      citations: {
        keyReferences: [],
        citationCount: 0,
        referencedAuthors: [],
      },
      relatedTopics: [],
    };

    try {
      // Parse sections using regex patterns
      const summaryMatch = result.match(/## EXECUTIVE SUMMARY\s*([\s\S]*?)(?=##|$)/);
      if (summaryMatch) {
        analysis.summary = summaryMatch[1].trim();
      }

      const findingsMatch = result.match(/## KEY FINDINGS\s*([\s\S]*?)(?=##|$)/);
      if (findingsMatch) {
        analysis.keyFindings = this.parseListFromText(findingsMatch[1]);
      }

      const methodologyMatch = result.match(/## METHODOLOGY ANALYSIS\s*([\s\S]*?)(?=##|$)/);
      if (methodologyMatch) {
        analysis.methodology = methodologyMatch[1].trim();
      }

      const contributionsMatch = result.match(/## MAIN CONTRIBUTIONS\s*([\s\S]*?)(?=##|$)/);
      if (contributionsMatch) {
        analysis.mainContributions = this.parseListFromText(contributionsMatch[1]);
      }

      // Parse critical analysis
      const strengthsMatch = result.match(/### Strengths:\s*([\s\S]*?)(?=###|##|$)/);
      if (strengthsMatch) {
        analysis.criticalAnalysis!.strengths = this.parseListFromText(strengthsMatch[1]);
      }

      const weaknessesMatch = result.match(/### Weaknesses:\s*([\s\S]*?)(?=###|##|$)/);
      if (weaknessesMatch) {
        analysis.criticalAnalysis!.weaknesses = this.parseListFromText(weaknessesMatch[1]);
      }

      const implicationsMatch = result.match(/### Implications:\s*([\s\S]*?)(?=###|##|$)/);
      if (implicationsMatch) {
        analysis.criticalAnalysis!.implications = this.parseListFromText(implicationsMatch[1]);
      }

      // Parse technical details
      const algorithmsMatch = result.match(/### Algorithms\/Methods:\s*([\s\S]*?)(?=###|##|$)/);
      if (algorithmsMatch) {
        analysis.technicalDetails!.algorithms = this.parseListFromText(algorithmsMatch[1]);
      }

      const datasetsMatch = result.match(/### Datasets:\s*([\s\S]*?)(?=###|##|$)/);
      if (datasetsMatch) {
        analysis.technicalDetails!.datasets = this.parseListFromText(datasetsMatch[1]);
      }

      const metricsMatch = result.match(/### Evaluation Metrics:\s*([\s\S]*?)(?=###|##|$)/);
      if (metricsMatch) {
        analysis.technicalDetails!.metrics = this.parseListFromText(metricsMatch[1]);
      }

      const toolsMatch = result.match(/### Tools\/Technologies:\s*([\s\S]*?)(?=###|##|$)/);
      if (toolsMatch) {
        analysis.technicalDetails!.tools = this.parseListFromText(toolsMatch[1]);
      }

    } catch (error) {
      console.error('Error parsing comprehensive analysis:', error);
    }

    return analysis;
  }

  private parseConceptsResult(result: string): ConceptExtraction[] {
    const concepts: ConceptExtraction[] = [];
    
    try {
      // Split by numbered items or bullet points
      const items = result.split(/\d+\.|[-•]\s/).filter(item => item.trim());
      
      for (const item of items) {
        const lines = item.trim().split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const term = lines[0].replace(/[:\-]/g, '').trim();
          const definition = lines.slice(1).join(' ').trim();
          
          concepts.push({
            term,
            definition: definition || 'No definition provided',
            importance: this.determineImportance(definition),
            relatedTerms: [],
            context: definition,
          });
        }
      }
    } catch (error) {
      console.error('Error parsing concepts:', error);
    }
    
    return concepts;
  }

  private parseQuestionsResult(result: string): string[] {
    try {
      return result
        .split(/\d+\./)
        .map(q => q.trim())
        .filter(q => q.length > 0 && q.includes('?'));
    } catch (error) {
      console.error('Error parsing questions:', error);
      return [];
    }
  }

  private parseListResult(result: string): string[] {
    try {
      return result
        .split(/\d+\.|[-•]\s/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    } catch (error) {
      console.error('Error parsing list result:', error);
      return [];
    }
  }

  private parseListFromText(text: string): string[] {
    return text
      .split(/\d+\.|[-•]\s/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private determineImportance(definition: string): 'high' | 'medium' | 'low' {
    const highKeywords = ['key', 'main', 'primary', 'central', 'core', 'fundamental', 'critical'];
    const lowKeywords = ['minor', 'secondary', 'auxiliary', 'supplementary'];
    
    const lowerDef = definition.toLowerCase();
    
    if (highKeywords.some(keyword => lowerDef.includes(keyword))) {
      return 'high';
    } else if (lowKeywords.some(keyword => lowerDef.includes(keyword))) {
      return 'low';
    }
    
    return 'medium';
  }
}

export const aiAnalysisService = new AIAnalysisService();
