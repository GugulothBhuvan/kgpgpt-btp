import { QdrantClient } from './qdrant-client';
import { getConfig, Config } from '../config';

export async function setupQdrantCollections(
  client: QdrantClient,
  config: Config
): Promise<boolean> {
  try {
    const collections = [config.qdrant.collections.metakgp, config.qdrant.collections.iitkgp];
    
    for (const collectionName of collections) {
      console.log(`Setting up collection: ${collectionName}`);
      
      // Check if collection exists
      const existingCollections = await client.getCollections();
      console.log('Collections response:', JSON.stringify(existingCollections, null, 2));
      
      // Try to determine if collection exists
      let collectionExists = false;
      
      // Handle different response structures from Qdrant
      if (existingCollections && (existingCollections as any).result && (existingCollections as any).result.collections && Array.isArray((existingCollections as any).result.collections)) {
        // New Qdrant response format
        collectionExists = (existingCollections as any).result.collections.some(
          (col: any) => col.name === collectionName
        );
      } else if (existingCollections && (existingCollections as any).collections && Array.isArray((existingCollections as any).collections)) {
        // Legacy response format
        collectionExists = (existingCollections as any).collections.some(
          (col: any) => col.name === collectionName
        );
      } else if (existingCollections && Array.isArray(existingCollections)) {
        // Direct array response
        collectionExists = existingCollections.some(
          (col: any) => col.name === collectionName
        );
      }
      
      if (!collectionExists) {
        console.log(`Creating collection: ${collectionName}`);
        
        try {
          // Create collection with proper configuration
          await client.createCollection(collectionName, config.qdrant.vectorSize);
          console.log(`Collection ${collectionName} created successfully`);
        } catch (createError) {
          console.error(`Failed to create collection ${collectionName}:`, createError);
          return false;
        }
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }
      
      // Wait a moment for collection to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify collection is ready
      try {
        const collectionInfo = await client.getCollection(collectionName);
        console.log('Collection info:', JSON.stringify(collectionInfo, null, 2));
        
        if (collectionInfo.status === 'green') {
          console.log(`Collection ${collectionName} is ready`);
        } else {
          console.log(`Collection ${collectionName} status: ${collectionInfo.status}`);
          return false;
        }
      } catch (verifyError) {
        console.error(`Failed to verify collection ${collectionName}:`, verifyError);
        return false;
      }
    }
    
    console.log('All collections are ready');
    return true;
    
  } catch (error) {
    console.error('Failed to setup Qdrant collections:', error);
    return false;
  }
}

// Legacy function for backward compatibility
export async function setupQdrantCollection(
  client: QdrantClient,
  config: Config
): Promise<boolean> {
  console.warn('setupQdrantCollection is deprecated. Use setupQdrantCollections instead.');
  return setupQdrantCollections(client, config);
}

export async function indexDocuments(
  client: QdrantClient,
  documents: Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
    collection?: string; // Optional: specify which collection to use
  }>,
  config: Config,
  collectionName?: string
): Promise<boolean> {
  try {
    // Use specified collection or default based on source
    const targetCollection = collectionName || 
      (documents[0]?.metadata?.source === 'iitkgp' ? config.qdrant.collections.iitkgp : config.qdrant.collections.metakgp);
    
    console.log(`Indexing ${documents.length} documents to collection: ${targetCollection}`);
    
    // Prepare points for indexing
    const points = documents.map(doc => ({
      id: doc.id,
      vector: doc.embedding,
      payload: {
        content: doc.content,
        metadata: doc.metadata,
        source: doc.metadata.source || 'unknown',
        timestamp: new Date().toISOString()
      }
    }));
    
    // Upsert points in batches
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      
      await client.upsert(targetCollection, batch);
      
      console.log(`Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`);
    }
    
    console.log(`Successfully indexed ${documents.length} documents to ${targetCollection}`);
    return true;
    
  } catch (error) {
    console.error('Failed to index documents:', error);
    return false;
  }
}

export async function searchDocuments(
  client: QdrantClient,
  query: string,
  embedding: number[],
  config: Config,
  collectionName?: string
): Promise<any[]> {
  try {
    const targetCollection = collectionName || 
      (config.system.defaultCollection === 'iitkgp' ? config.qdrant.collections.iitkgp : config.qdrant.collections.metakgp);
    
    console.log(`Searching in collection: ${targetCollection}`);
    
    const response = await client.search(targetCollection, {
      vector: embedding,
      limit: config.system.maxRetrievalResults,
      with_payload: true,
      with_vector: false
    });
    
    // Extract results from the response
    const results = (response as any).result || response || [];
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Failed to search documents:', error);
    return [];
  }
}

// Search across both collections
export async function searchAllCollections(
  client: QdrantClient,
  query: string,
  embedding: number[],
  config: Config
): Promise<any[]> {
  try {
    const allResults: any[] = [];
    
    // Search in both collections
    for (const collectionName of [config.qdrant.collections.metakgp, config.qdrant.collections.iitkgp]) {
      try {
        const results = await client.search(collectionName, {
          vector: embedding,
          limit: Math.ceil(config.system.maxRetrievalResults / 2), // Split limit between collections
          with_payload: true,
          with_vector: false
        });
        
        // Add collection info to results
        const resultsWithSource = (results as any).map((result: any) => ({
          ...result,
          payload: {
            ...result.payload,
            collection: collectionName
          }
        }));
        
        allResults.push(...(resultsWithSource as any[]));
      } catch (error) {
        console.error(`Failed to search in collection ${collectionName}:`, error);
      }
    }
    
    // Sort by score and return top results
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    return allResults.slice(0, config.system.maxRetrievalResults);
    
  } catch (error) {
    console.error('Failed to search all collections:', error);
    return [];
  }
}

export async function getCollectionStats(
  client: QdrantClient,
  collectionName: string
): Promise<any> {
  try {
    const info = await client.getCollection(collectionName);
    const result = info.result || info;
    
    return {
      name: collectionName,
      status: result.status || 'ok',
      vectorSize: result.config?.params?.vectors?.size || result.config?.vectors?.size,
      pointsCount: result.points_count || result.vectors_count || 0,
      segmentsCount: result.segments_count || result.config?.optimizers_config?.default_segment_number
    };
  } catch (error) {
    console.error('Failed to get collection stats:', error);
    return null;
  }
}

export async function deleteCollection(
  client: QdrantClient,
  collectionName: string
): Promise<boolean> {
  try {
    await client.deleteCollection(collectionName);
    console.log(`Collection ${collectionName} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Failed to delete collection:', error);
    return false;
  }
}
