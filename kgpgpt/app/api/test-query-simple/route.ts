import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log('🧪 Testing simple query:', query);
    
    // Test the actual query API
    const response = await fetch('http://localhost:3000/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: query,
        enableWebSearch: true,
        isFirstMessage: true,
        conversationHistory: []
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        originalQuery: query,
        response: data.response,
        confidence: data.confidence,
        sources: data.sources,
        isSimpleResponse: data.metadata?.isSimpleResponse,
        processingTime: data.metadata?.totalProcessingTime,
        queryAnalysis: data.queryAnalysis
      });
    } else {
      const errorData = await response.text();
      return NextResponse.json({
        success: false,
        error: 'Query API failed',
        status: response.status,
        details: errorData
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('❌ Simple query test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Simple query test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method with {"query": "your message"} to test the query API',
    example: {
      method: 'POST',
      body: { query: 'hi' }
    }
  });
}
