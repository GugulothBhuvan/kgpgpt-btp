import { NextResponse } from 'next/server';
import { QdrantClient } from '@/lib/utils/qdrant-client';
import { getConfig } from '@/lib/config';
import { getCollectionStats } from '@/lib/utils/qdrant-setup';

export async function GET() {
  try {
    const config = getConfig();
    const healthStatus: any = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      services: {},
      config: {
        qdrant: {
          url: config.qdrant.url,
          collectionName: 'kgp_knowledge_base'
        },
        gemini: {
          model: config.gemini.model,
          apiKeyPresent: !!config.gemini.apiKey
        },
        serper: {
          apiKeyPresent: !!config.serper.apiKey
        }
      }
    };
    
    // Check Qdrant connection
    try {
      const qdrantClient = new QdrantClient({ url: config.qdrant.url });
      const collectionsResponse = await qdrantClient.getCollections();
      const collections = collectionsResponse.result?.collections || collectionsResponse.collections || [];
      
      healthStatus.services.qdrant = {
        status: 'healthy',
        url: config.qdrant.url,
        collections: collections.length,
        details: 'Successfully connected to Qdrant'
      };
      
      // Get collection stats if it exists
      const targetCollection = collections.find(
        (col: any) => col.name === 'kgp_knowledge_base'
      );
      
      if (targetCollection) {
        const stats = await getCollectionStats(qdrantClient, 'kgp_knowledge_base');
        healthStatus.services.qdrant.collectionStats = stats;
      }
      
    } catch (error) {
      healthStatus.services.qdrant = {
        status: 'unhealthy',
        url: config.qdrant.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to connect to Qdrant'
      };
    }
    
    // Check Gemini API (basic check)
    if (config.gemini.apiKey) {
      healthStatus.services.gemini = {
        status: 'configured',
        model: config.gemini.model,
        details: 'API key is present (not validated)'
      };
    } else {
      healthStatus.services.gemini = {
        status: 'unconfigured',
        details: 'No API key provided'
      };
    }
    
    // Check Serper API (basic check)
    if (config.serper.apiKey) {
      healthStatus.services.serper = {
        status: 'configured',
        details: 'API key is present (not validated)'
      };
    } else {
      healthStatus.services.serper = {
        status: 'unconfigured',
        details: 'No API key provided'
      };
    }
    
    // Determine overall status
    const healthyServices = Object.values(healthStatus.services).filter(
      (service: any) => service.status === 'healthy'
    ).length;
    const totalServices = Object.keys(healthStatus.services).length;
    
    if (healthyServices === totalServices) {
      healthStatus.status = 'healthy';
    } else if (healthyServices >= totalServices * 0.5) {
      healthStatus.status = 'degraded';
    } else {
      healthStatus.status = 'unhealthy';
    }
    
    return NextResponse.json(healthStatus);
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
