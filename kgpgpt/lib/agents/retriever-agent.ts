import { BaseAgent } from './base-agent';
import { QdrantClient } from '@/lib/utils/qdrant-client';

export interface RetrievedDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  source: string;
}

export interface RetrievalResult {
  documents: RetrievedDocument[];
  totalFound: number;
  query: string;
  searchTime: number;
}

export class RetrieverAgent extends BaseAgent {
  private qdrantClient: QdrantClient;
  private collectionName: string;

  constructor(qdrantClient: QdrantClient, collectionName: string = 'metakgp_pages') {
    super(
      'Retriever Agent (R-A)',
      'Handles local retrieval from Qdrant vector database'
    );
    this.qdrantClient = qdrantClient;
    this.collectionName = collectionName;
  }

  async process(query: string): Promise<RetrievalResult> {
    this.log(`Retrieving documents for query: "${query}"`);
    const startTime = Date.now();

    try {
      // Generate embeddings for the query (this would normally use Gemini embeddings)
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Search Qdrant for similar documents
      const searchResults = await this.qdrantClient.search(this.collectionName, {
        vector: queryEmbedding,
        limit: 5, // Top-5 as per architecture
        with_payload: true,
        with_vector: false
      });

      // Transform results to our interface
      const documents: RetrievedDocument[] = searchResults.result.map(result => ({
        id: result.id as string,
        content: result.payload?.content || '',
        metadata: result.payload?.metadata || {},
        score: result.score || 0,
        source: result.payload?.source || 'unknown'
      }));

      const searchTime = Date.now() - startTime;
      
      this.log(`Retrieved ${documents.length} documents in ${searchTime}ms`);
      
      return {
        documents,
        totalFound: documents.length,
        query,
        searchTime
      };

    } catch (error) {
      this.error('Failed to retrieve documents', error);
      throw new Error(`Retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // TODO: Replace with actual Gemini embeddings API call
    // For now, return a dummy embedding (this should be replaced)
    this.log('Generating query embedding (placeholder implementation)');
    
    // Placeholder: return a simple hash-based "embedding"
    const hash = this.simpleHash(query);
    const embedding = new Array(768).fill(0);
    for (let i = 0; i < Math.min(hash.length, 768); i++) {
      embedding[i] = (hash.charCodeAt(i) - 97) / 26; // Normalize to 0-1 range
    }
    
    return embedding;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async getCollectionInfo(): Promise<any> {
    try {
      const info = await this.qdrantClient.getCollection(this.collectionName);
      return info;
    } catch (error) {
      this.error('Failed to get collection info', error);
      return null;
    }
  }

  async isCollectionReady(): Promise<boolean> {
    try {
      const info = await this.getCollectionInfo();
      // Qdrant returns { result: { status: "green", ... } }
      const status = info?.result?.status || info?.status;
      return status === 'green';
    } catch (error) {
      return false;
    }
  }
}
