import { NextRequest, NextResponse } from 'next/server';
import { WebSearchAgent } from '@/lib/agents/web-search-agent';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Testing LinkedIn search for query:', query);
    
    // Get configuration
    const config = getConfig();
    
    // Initialize web search agent with BrightData
    const webSearchAgent = new WebSearchAgent(
      config.serper.apiKey,
      config.brightdata.apiKey,
      config.brightdata.username,
      config.brightdata.password
    );
    
    // Test LinkedIn search
    const startTime = Date.now();
    const result = await webSearchAgent.process(query);
    const searchTime = Date.now() - startTime;
    
    console.log(`✅ LinkedIn search completed in ${searchTime}ms`);
    console.log(`📊 Found ${result.results.length} results`);
    
    // Filter LinkedIn results
    const linkedinResults = result.results.filter(r => r.searchEngine?.includes('LinkedIn'));
    
    return NextResponse.json({
      success: true,
      query,
      totalResults: result.results.length,
      linkedinResults: linkedinResults.length,
      searchTime,
      results: result.results,
      linkedinProfiles: linkedinResults.map(r => ({
        name: r.linkedinData?.name,
        title: r.linkedinData?.current_company?.title,
        company: r.linkedinData?.current_company?.name,
        location: r.linkedinData?.city,
        followers: r.linkedinData?.followers,
        connections: r.linkedinData?.connections,
        experience: r.linkedinData?.experience?.slice(0, 3), // First 3 experiences
        education: r.linkedinData?.education?.slice(0, 2), // First 2 education entries
        url: r.linkedinData?.url,
        relevance: r.relevance
      })),
      enabledEngines: webSearchAgent.getEnabledEngines(),
      apiKeyStatus: webSearchAgent.getApiKeyStatus()
    });
    
  } catch (error) {
    console.error('❌ LinkedIn search test failed:', error);
    return NextResponse.json(
      { 
        error: 'LinkedIn search test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const config = getConfig();
    
    const webSearchAgent = new WebSearchAgent(
      config.serper.apiKey,
      config.brightdata.apiKey,
      config.brightdata.username,
      config.brightdata.password
    );
    
    return NextResponse.json({
      success: true,
      enabledEngines: webSearchAgent.getEnabledEngines(),
      apiKeyStatus: webSearchAgent.getApiKeyStatus(),
      brightdataConfigured: !!(config.brightdata.apiKey && config.brightdata.username && config.brightdata.password),
      config: {
        hasSerperKey: !!config.serper.apiKey,
        hasBrightdataKey: !!config.brightdata.apiKey,
        hasBrightdataUsername: !!config.brightdata.username,
        hasBrightdataPassword: !!config.brightdata.password
      }
    });
    
  } catch (error) {
    console.error('❌ LinkedIn search status check failed:', error);
    return NextResponse.json(
      { 
        error: 'LinkedIn search status check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
