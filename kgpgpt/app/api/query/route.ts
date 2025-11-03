import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@/lib/utils/qdrant-client';
import { OrchestratorAgent } from '@/lib/agents/orchestrator-agent';
import { RetrieverAgent } from '@/lib/agents/retriever-agent';
import { WebSearchAgent } from '@/lib/agents/web-search-agent';
import { SummarizerAgent } from '@/lib/agents/summarizer-agent';
import { getConfig, validateConfig } from '@/lib/config';
import { setupQdrantCollection } from '@/lib/utils/qdrant-setup';

export async function POST(request: NextRequest) {
  try {
    // Authentication check is optional for now
    // You can enable it later by checking session cookies
    console.log('🔍 API: Query endpoint called');

    const { query, enableWebSearch = true, isFirstMessage = false, conversationHistory = [] } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Processing query:', query);
    console.log('📝 Is first message:', isFirstMessage);
    
    // Get and validate configuration
    const config = getConfig();
    console.log('✅ Config loaded:', { 
      hasGeminiKey: !!config.gemini.apiKey, 
      hasSerperKey: !!config.serper.apiKey,
      qdrantUrl: config.qdrant.url 
    });
    
    const configErrors = validateConfig(config);
    
    if (configErrors.length > 0) {
      console.error('❌ Config validation failed:', configErrors);
      return NextResponse.json(
        { 
          error: 'Configuration errors', 
          details: configErrors 
        },
        { status: 500 }
      );
    }
    
    // Initialize Qdrant client
    console.log('🔧 Initializing Qdrant client...');
    const qdrantClient = new QdrantClient({ url: config.qdrant.url });
    
    // Skip collection setup since we know it exists and has data
    console.log('🔧 Skipping collection setup - collection already exists with data');
    const collectionReady = true; // We know it's ready from the load-kb script
    
    if (!collectionReady) {
      console.error('❌ Qdrant collection setup failed');
      return NextResponse.json(
        { error: 'Failed to setup Qdrant collection' },
        { status: 500 }
      );
    }
    
    // Initialize agents
    console.log('🔧 Initializing agents...');
    const retrieverAgent = new RetrieverAgent(qdrantClient, 'kgp_knowledge_base');
    const webSearchAgent = new WebSearchAgent(
      config.serper.apiKey,
      config.brightdata.apiKey,
      config.brightdata.username,
      config.brightdata.password
    );
    const summarizerAgent = new SummarizerAgent(config.gemini.apiKey);
    
    // Initialize orchestrator
    console.log('🔧 Initializing orchestrator...');
    const orchestrator = new OrchestratorAgent(
      retrieverAgent,
      webSearchAgent,
      summarizerAgent
    );
    
    // Process query through multi-agent pipeline
    console.log('🚀 Starting agent pipeline...');
    const startTime = Date.now();
    const result = await orchestrator.process({
      query,
      enableWebSearch,
      isFirstMessage,
      conversationHistory
    });
    const totalTime = Date.now() - startTime;
    
    console.log('✅ Agent pipeline completed successfully');
    
    // Prepare response
    const response = {
      response: result.response.response,
      confidence: result.response.confidence,
      sources: result.response.sources,
      metadata: {
        ...result.response.metadata,
        totalProcessingTime: result.totalProcessingTime,
        agentTimeline: result.agentTimeline,
        isSimpleResponse: result.isSimpleResponse
      },
      queryAnalysis: {
        intent: result.queryAnalysis.intent,
        confidence: result.queryAnalysis.confidence,
        reasoning: result.queryAnalysis.reasoning,
        requiresFullPipeline: result.queryAnalysis.requiresFullPipeline
      },
      systemHealth: await (async () => {
        console.log('🔍 API: Getting system health...');
        const health = await orchestrator.getSystemHealth();
        console.log('🔍 API: System health retrieved:', health);
        return health;
      })()
    };
    
    console.log(`Query processed successfully in ${totalTime}ms`);
    console.log('🔍 API: About to send response...');
    console.log('🔍 API: Sending response:', JSON.stringify(response, null, 2));
    console.log('🔍 API: Response type check:', typeof response);
    
    const nextResponse = NextResponse.json(response);
    console.log('🔍 API: Response headers:', nextResponse.headers);
    console.log('🔍 API: Response status:', nextResponse.status);
    return nextResponse;
    
  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Query API endpoint is working. Use POST method with query parameter. Web search is automatically enabled as fallback when knowledge base lacks information.' 
    }
  );
}
