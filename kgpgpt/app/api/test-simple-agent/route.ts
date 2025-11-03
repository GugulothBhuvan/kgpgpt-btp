import { NextRequest, NextResponse } from 'next/server';
import { SimpleResponseAgent } from '@/lib/agents/simple-response-agent';
import { QueryUnderstandingAgent } from '@/lib/agents/query-understanding-agent';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log('🧪 Testing SimpleResponseAgent with query:', query);
    
    // Test query understanding first
    const queryUnderstandingAgent = new QueryUnderstandingAgent();
    const queryAnalysis = await queryUnderstandingAgent.process(query);
    
    console.log('Query analysis:', {
      intent: queryAnalysis.intent,
      requiresFullPipeline: queryAnalysis.requiresFullPipeline,
      confidence: queryAnalysis.confidence
    });
    
    // Test simple response agent
    const simpleResponseAgent = new SimpleResponseAgent();
    const simpleResponse = await simpleResponseAgent.process(query);
    
    console.log('Simple response:', {
      response: simpleResponse.response,
      confidence: simpleResponse.confidence,
      sources: simpleResponse.sources,
      metadata: simpleResponse.metadata
    });
    
    return NextResponse.json({
      success: true,
      query,
      queryAnalysis: {
        intent: queryAnalysis.intent,
        requiresFullPipeline: queryAnalysis.requiresFullPipeline,
        confidence: queryAnalysis.confidence,
        reasoning: queryAnalysis.reasoning
      },
      simpleResponse: {
        response: simpleResponse.response,
        confidence: simpleResponse.confidence,
        sources: simpleResponse.sources,
        metadata: simpleResponse.metadata
      },
      shouldUseSimpleResponse: !queryAnalysis.requiresFullPipeline
    });
    
  } catch (error) {
    console.error('❌ Simple agent test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple agent test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test with some sample queries
  const testQueries = ['hi', 'hello', 'hey', 'thanks', 'ok', 'bye'];
  const results = [];
  
  for (const query of testQueries) {
    try {
      const queryUnderstandingAgent = new QueryUnderstandingAgent();
      const queryAnalysis = await queryUnderstandingAgent.process(query);
      
      const simpleResponseAgent = new SimpleResponseAgent();
      const simpleResponse = await simpleResponseAgent.process(query);
      
      results.push({
        query,
        intent: queryAnalysis.intent,
        requiresFullPipeline: queryAnalysis.requiresFullPipeline,
        response: simpleResponse.response,
        confidence: simpleResponse.confidence,
        responseType: simpleResponse.metadata.responseType
      });
    } catch (error) {
      results.push({
        query,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    testResults: results
  });
}
