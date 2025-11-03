import { NextResponse } from 'next/server';
import { getConfig, validateConfig } from '@/lib/config';
import { QdrantClient } from '@/lib/utils/qdrant-client';
import { setupQdrantCollection } from '@/lib/utils/qdrant-setup';

export async function GET() {
  try {
    console.log('🧪 Testing agent initialization...');
    
    // Test 1: Config
    console.log('1️⃣ Testing config...');
    const config = getConfig();
    console.log('✅ Config loaded:', { 
      hasGeminiKey: !!config.gemini.apiKey, 
      hasSerperKey: !!config.serper.apiKey,
      qdrantUrl: config.qdrant.url 
    });
    
    const configErrors = validateConfig(config);
    if (configErrors.length > 0) {
      console.error('❌ Config validation failed:', configErrors);
      return NextResponse.json({ error: 'Config validation failed', details: configErrors }, { status: 500 });
    }
    console.log('✅ Config validation passed');
    
    // Test 2: Qdrant connection
    console.log('2️⃣ Testing Qdrant connection...');
    const qdrantClient = new QdrantClient({ url: config.qdrant.url });
    const collectionReady = await setupQdrantCollection(qdrantClient, config);
    if (!collectionReady) {
      console.error('❌ Qdrant collection setup failed');
      return NextResponse.json({ error: 'Qdrant collection setup failed' }, { status: 500 });
    }
    console.log('✅ Qdrant collection ready');
    
    // Test 3: Simple Qdrant search
    console.log('3️⃣ Testing Qdrant search...');
    try {
      const testEmbedding = new Array(768).fill(0.1);
              const searchResults = await qdrantClient.search(config.qdrant.collections.metakgp, {
        vector: testEmbedding,
        limit: 1,
        with_payload: true,
        with_vector: false
      });
      console.log('✅ Qdrant search successful, found:', searchResults.result?.length || 0, 'results');
    } catch (error) {
      console.error('❌ Qdrant search failed:', error);
      return NextResponse.json({ error: 'Qdrant search failed', details: error }, { status: 500 });
    }
    
    console.log('🎉 All tests passed!');
    return NextResponse.json({ 
      status: 'success', 
      message: 'All agent initialization tests passed',
      qdrantResults: 'Search successful',
      config: {
        hasGeminiKey: !!config.gemini.apiKey,
        hasSerperKey: !!config.serper.apiKey,
        qdrantUrl: config.qdrant.url
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
