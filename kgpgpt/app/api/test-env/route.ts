import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check which environment variables are loaded
    const envCheck = {
      // Required variables
      GEMINI_API_KEY: {
        loaded: !!process.env.GEMINI_API_KEY,
        value: process.env.GEMINI_API_KEY ? 
          `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 
          'NOT SET',
        required: true
      },
      SERPER_API_KEY: {
        loaded: !!process.env.SERPER_API_KEY,
        value: process.env.SERPER_API_KEY ? 
          `${process.env.SERPER_API_KEY.substring(0, 8)}...` : 
          'NOT SET',
        required: true
      },
      
      // Optional variables
      BRIGHTDATA_API_KEY: {
        loaded: !!process.env.BRIGHTDATA_API_KEY,
        value: process.env.BRIGHTDATA_API_KEY ? 
          `${process.env.BRIGHTDATA_API_KEY.substring(0, 8)}...` : 
          'NOT SET',
        required: false
      },
      BRIGHTDATA_USERNAME: {
        loaded: !!process.env.BRIGHTDATA_USERNAME,
        value: process.env.BRIGHTDATA_USERNAME || 'NOT SET',
        required: false
      },
      BRIGHTDATA_PASSWORD: {
        loaded: !!process.env.BRIGHTDATA_PASSWORD,
        value: process.env.BRIGHTDATA_PASSWORD ? 'SET' : 'NOT SET',
        required: false
      },
      DEEPGRAM_API_KEY: {
        loaded: !!process.env.DEEPGRAM_API_KEY,
        value: process.env.DEEPGRAM_API_KEY ? 
          `${process.env.DEEPGRAM_API_KEY.substring(0, 8)}...` : 
          'NOT SET',
        required: false
      },
      
      // System variables
      QDRANT_URL: {
        loaded: !!process.env.QDRANT_URL,
        value: process.env.QDRANT_URL || 'NOT SET',
        required: true
      },
      QDRANT_COLLECTION_METAKGP: {
        loaded: !!process.env.QDRANT_COLLECTION_METAKGP,
        value: process.env.QDRANT_COLLECTION_METAKGP || 'NOT SET',
        required: true
      },
      QDRANT_COLLECTION_IITKGP: {
        loaded: !!process.env.QDRANT_COLLECTION_IITKGP,
        value: process.env.QDRANT_COLLECTION_IITKGP || 'NOT SET',
        required: true
      }
    };

    // Check if all required variables are loaded
    const requiredVars = Object.entries(envCheck)
      .filter(([_, config]) => config.required)
      .map(([key, config]) => ({ key, loaded: config.loaded }));

    const missingRequired = requiredVars.filter(({ loaded }) => !loaded);
    const allRequiredLoaded = missingRequired.length === 0;

    return NextResponse.json({
      success: true,
      environmentLoaded: allRequiredLoaded,
      missingRequired: missingRequired.map(({ key }) => key),
      environmentVariables: envCheck,
      summary: {
        total: Object.keys(envCheck).length,
        loaded: Object.values(envCheck).filter(v => v.loaded).length,
        required: requiredVars.length,
        requiredLoaded: requiredVars.filter(v => v.loaded).length
      },
      recommendations: allRequiredLoaded ? 
        ['✅ All required environment variables are loaded!'] :
        [
          '❌ Missing required environment variables:',
          ...missingRequired.map(({ key }) => `   - ${key}`),
          '',
          '💡 Make sure your .env.local file contains all required variables.',
          '💡 Restart your development server after updating .env.local'
        ]
    });

  } catch (error) {
    console.error('❌ Environment check failed:', error);
    return NextResponse.json(
      { 
        error: 'Environment check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
