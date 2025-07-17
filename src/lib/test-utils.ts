import { Paper } from './types';
import { Annotation } from './annotation-types';

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export interface WorkflowTestResult {
  testName: string;
  steps: Array<{
    name: string;
    result: TestResult;
  }>;
  overallSuccess: boolean;
  totalDuration: number;
}

export class EndToEndTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async testCompleteWorkflow(): Promise<WorkflowTestResult> {
    const startTime = Date.now();
    const steps: Array<{ name: string; result: TestResult }> = [];

    // Step 1: Test PDF Upload
    const uploadResult = await this.testPDFUpload();
    steps.push({ name: 'PDF Upload', result: uploadResult });

    let paperId: string | null = null;
    if (uploadResult.success && uploadResult.details?.paperId) {
      paperId = uploadResult.details.paperId;
    }

    // Step 2: Test PDF Display
    if (paperId) {
      const displayResult = await this.testPDFDisplay(paperId);
      steps.push({ name: 'PDF Display', result: displayResult });
    }

    // Step 3: Test AI Analysis
    if (paperId) {
      const analysisResult = await this.testAIAnalysis(paperId);
      steps.push({ name: 'AI Analysis', result: analysisResult });
    }

    // Step 4: Test Annotation System
    if (paperId) {
      const annotationResult = await this.testAnnotationSystem(paperId);
      steps.push({ name: 'Annotation System', result: annotationResult });
    }

    // Step 5: Test Q&A System
    if (paperId) {
      const qaResult = await this.testQASystem(paperId);
      steps.push({ name: 'Q&A System', result: qaResult });
    }

    // Step 6: Test Data Persistence
    if (paperId) {
      const persistenceResult = await this.testDataPersistence(paperId);
      steps.push({ name: 'Data Persistence', result: persistenceResult });
    }

    const totalDuration = Date.now() - startTime;
    const overallSuccess = steps.every(step => step.result.success);

    return {
      testName: 'Complete Workflow Test',
      steps,
      overallSuccess,
      totalDuration,
    };
  }

  async testPDFUpload(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Create a test PDF file (mock)
      const testPDFContent = this.createTestPDFBuffer();
      
      const formData = new FormData();
      const blob = new Blob([testPDFContent], { type: 'application/pdf' });
      formData.append('file', blob, 'test-paper.pdf');

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success) {
        return {
          success: true,
          message: 'PDF upload successful',
          details: { paperId: result.data?.id },
          duration,
        };
      } else {
        return {
          success: false,
          message: `Upload failed: ${result.error || 'Unknown error'}`,
          duration,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  async testPDFDisplay(paperId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test if PDF file exists and is accessible
      const response = await fetch(`${this.baseUrl}/uploads/${paperId}.pdf`);
      const duration = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'PDF display test successful',
          duration,
        };
      } else {
        return {
          success: false,
          message: `PDF not accessible: ${response.status}`,
          duration,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `PDF display error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  async testAIAnalysis(paperId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperId,
          analysisType: 'comprehensive',
        }),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success && result.data) {
        const analysis = result.data;
        const hasRequiredFields = analysis.summary && 
                                 analysis.keyFindings && 
                                 analysis.mainContributions;

        if (hasRequiredFields) {
          return {
            success: true,
            message: 'AI analysis successful',
            details: { analysisLength: analysis.summary.length },
            duration,
          };
        } else {
          return {
            success: false,
            message: 'AI analysis incomplete - missing required fields',
            duration,
          };
        }
      } else {
        return {
          success: false,
          message: `AI analysis failed: ${result.error || 'Unknown error'}`,
          duration,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `AI analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  async testAnnotationSystem(paperId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test creating an annotation
      const testAnnotation: Partial<Annotation> = {
        paperId,
        type: 'highlight',
        content: 'Test highlight annotation',
        pageNumber: 1,
        selection: {
          startOffset: 0,
          endOffset: 10,
          selectedText: 'Test text',
          pageNumber: 1,
        },
      };

      const createResponse = await fetch(`${this.baseUrl}/api/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testAnnotation),
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok || !createResult.success) {
        return {
          success: false,
          message: `Annotation creation failed: ${createResult.error || 'Unknown error'}`,
          duration: Date.now() - startTime,
        };
      }

      // Test retrieving annotations
      const getResponse = await fetch(`${this.baseUrl}/api/annotations?paperId=${paperId}`);
      const getResult = await getResponse.json();

      const duration = Date.now() - startTime;

      if (getResponse.ok && getResult.success && Array.isArray(getResult.data)) {
        return {
          success: true,
          message: 'Annotation system test successful',
          details: { annotationCount: getResult.data.length },
          duration,
        };
      } else {
        return {
          success: false,
          message: `Annotation retrieval failed: ${getResult.error || 'Unknown error'}`,
          duration,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Annotation system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  async testQASystem(paperId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testQuestion = 'What is the main contribution of this paper?';
      
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperId,
          message: testQuestion,
        }),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (response.ok && result.success && result.data) {
        return {
          success: true,
          message: 'Q&A system test successful',
          details: { answerLength: result.data.length },
          duration,
        };
      } else {
        return {
          success: false,
          message: `Q&A system failed: ${result.error || 'Unknown error'}`,
          duration,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Q&A system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  async testDataPersistence(paperId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test that annotations persist across requests
      const response1 = await fetch(`${this.baseUrl}/api/annotations?paperId=${paperId}`);
      const result1 = await response1.json();

      if (!response1.ok || !result1.success) {
        return {
          success: false,
          message: 'Data persistence test failed - cannot retrieve annotations',
          duration: Date.now() - startTime,
        };
      }

      const initialCount = result1.data.length;

      // Wait a moment and check again
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response2 = await fetch(`${this.baseUrl}/api/annotations?paperId=${paperId}`);
      const result2 = await response2.json();

      const duration = Date.now() - startTime;

      if (response2.ok && result2.success && result2.data.length === initialCount) {
        return {
          success: true,
          message: 'Data persistence test successful',
          details: { persistedAnnotations: initialCount },
          duration,
        };
      } else {
        return {
          success: false,
          message: 'Data persistence test failed - annotation count mismatch',
          duration,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Data persistence error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private createTestPDFBuffer(): ArrayBuffer {
    // Create a minimal PDF structure for testing
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000189 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
284
%%EOF`;

    return new TextEncoder().encode(pdfContent).buffer;
  }
}

export const endToEndTester = new EndToEndTester();
