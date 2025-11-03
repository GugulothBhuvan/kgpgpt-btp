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
    
    console.log('🔍 Debug: Testing query:', query);
    
    // Call the actual query API
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
      
      // Log the full response structure
      console.log('🔍 Debug: Full API response structure:');
      console.log('Response keys:', Object.keys(data));
      console.log('Response.response:', data.response);
      console.log('Response.confidence:', data.confidence);
      console.log('Response.sources:', data.sources);
      console.log('Response.metadata:', data.metadata);
      console.log('Response.queryAnalysis:', data.queryAnalysis);
      
      return NextResponse.json({
        success: true,
        originalQuery: query,
        apiResponse: data,
        responseStructure: {
          hasResponse: !!data.response,
          responseType: typeof data.response,
          responseLength: data.response ? data.response.length : 0,
          hasConfidence: !!data.confidence,
          hasSources: !!data.sources,
          hasMetadata: !!data.metadata,
          isSimpleResponse: data.metadata?.isSimpleResponse,
          processingTime: data.metadata?.totalProcessingTime
        },
        // This is what the frontend should receive
        frontendData: {
          response: data.response,
          confidence: data.confidence,
          sources: data.sources,
          metadata: data.metadata
        }
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: 'API call failed',
        status: response.status,
        details: errorText
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method with {"query": "your message"} to debug the API response',
    example: {
      method: 'POST',
      body: { query: 'hi' }
    }
  });
}
