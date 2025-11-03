import { NextRequest, NextResponse } from 'next/server';
import { QueryUnderstandingAgent } from '@/lib/agents/query-understanding-agent';
import { SimpleResponseAgent } from '@/lib/agents/simple-response-agent';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Testing query routing for:', query);
    
    // Test query understanding
    const queryUnderstandingAgent = new QueryUnderstandingAgent();
    const queryAnalysis = await queryUnderstandingAgent.process(query);
    
    let simpleResponse = null;
    if (!queryAnalysis.requiresFullPipeline) {
      const simpleResponseAgent = new SimpleResponseAgent();
      simpleResponse = await simpleResponseAgent.process(query);
    }
    
    return NextResponse.json({
      success: true,
      query,
      queryAnalysis: {
        intent: queryAnalysis.intent,
        confidence: queryAnalysis.confidence,
        reasoning: queryAnalysis.reasoning,
        requiresWebSearch: queryAnalysis.requiresWebSearch,
        requiresFullPipeline: queryAnalysis.requiresFullPipeline,
        keywords: queryAnalysis.keywords
      },
      simpleResponse: simpleResponse ? {
        response: simpleResponse.response,
        confidence: simpleResponse.confidence,
        sources: simpleResponse.sources,
        responseType: simpleResponse.metadata.responseType,
        processingTime: simpleResponse.metadata.processingTime
      } : null,
      routing: {
        willUseSimpleResponse: !queryAnalysis.requiresFullPipeline,
        willUseFullPipeline: queryAnalysis.requiresFullPipeline,
        willUseWebSearch: queryAnalysis.requiresWebSearch
      }
    });
    
  } catch (error) {
    console.error('❌ Query routing test failed:', error);
    return NextResponse.json(
      { 
        error: 'Query routing test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test with some sample queries
  const testQueries = [
    'hi',
    'hello',
    'hey there',
    'thanks',
    'what can you do',
    'help',
    'bye',
    'who is Professor Chakladar',
    'tell me about IIT Kharagpur',
    'what is the admission process',
    'current placement statistics',
    'ok',
    'yes',
    'no',
    'test'
  ];
  
  const results = [];
  
  for (const query of testQueries) {
    try {
      const queryUnderstandingAgent = new QueryUnderstandingAgent();
      const queryAnalysis = await queryUnderstandingAgent.process(query);
      
      results.push({
        query,
        intent: queryAnalysis.intent,
        requiresFullPipeline: queryAnalysis.requiresFullPipeline,
        requiresWebSearch: queryAnalysis.requiresWebSearch,
        confidence: queryAnalysis.confidence
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
    testResults: results,
    summary: {
      total: results.length,
      simple: results.filter(r => r.intent === 'simple').length,
      local: results.filter(r => r.intent === 'local').length,
      internet: results.filter(r => r.intent === 'internet').length,
      hybrid: results.filter(r => r.intent === 'hybrid').length
    }
  });
}
