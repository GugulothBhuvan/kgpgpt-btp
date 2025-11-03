import { NextResponse } from 'next/server';
import { WebSearchAgent } from '@/lib/agents/web-search-agent';
import { getConfig } from '@/lib/config';

export async function GET() {
  try {
    console.log('🧪 Testing Serper API...');
    
    const config = getConfig();
    const apiKey = config.serper.apiKey;
    
    if (!apiKey) {
      console.error('❌ SERPER_API_KEY not found in environment');
      return NextResponse.json({ 
        error: 'API key missing', 
        message: 'SERPER_API_KEY environment variable not set' 
      }, { status: 500 });
    }
    
    console.log('✅ API key found (length:', apiKey.length, ')');
    
    console.log('🔧 Initializing Web Search Agent...');
    const webSearchAgent = new WebSearchAgent(apiKey);
    
    console.log('1️⃣ Testing API key validation...');
    const isApiValid = await webSearchAgent.isApiKeyValid();
    
    if (!isApiValid) {
      console.error('❌ Serper API key validation failed');
      return NextResponse.json({ 
        error: 'API key validation failed', 
        message: 'The Serper API key appears to be invalid or expired' 
      }, { status: 500 });
    }
    
    console.log('✅ API key validation successful');
    
    console.log('2️⃣ Testing web search functionality...');
    const searchResult = await webSearchAgent.process('IIT Kharagpur');
    
    if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
      console.error('❌ Web search returned no results');
      return NextResponse.json({ 
        error: 'Web search failed', 
        message: 'Search query returned no results' 
      }, { status: 500 });
    }
    
    console.log('✅ Web search successful, found', searchResult.results.length, 'results');
    
    console.log('3️⃣ Checking result structure...');
    const firstResult = searchResult.results[0];
    console.log('First result:', {
      title: firstResult.title,
      url: firstResult.link,
      snippet: firstResult.snippet?.substring(0, 100) + '...',
      relevance: firstResult.relevance
    });
    
    console.log('🎉 All Serper API tests passed!');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Serper API is working correctly',
      tests: {
        apiKeyLength: apiKey.length,
        apiKeyValid: isApiValid,
        searchResultsCount: searchResult.results.length,
        firstResult: {
          title: firstResult.title,
          url: firstResult.link,
          snippet: firstResult.snippet?.substring(0, 100) + '...',
          relevance: firstResult.relevance
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Serper API test failed:', error);
    
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Serper API test failed', 
      message: errorDetails,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

