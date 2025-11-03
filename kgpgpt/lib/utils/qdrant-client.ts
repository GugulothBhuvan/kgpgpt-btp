import axios from 'axios';

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export interface QdrantCollection {
  name: string;
  vectors_count: number;
}

export interface QdrantSearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

export interface QdrantSearchResponse {
  result: QdrantSearchResult[];
  status: string;
  time: number;
}

export interface QdrantCollectionsResponse {
  collections: QdrantCollection[];
}

export class QdrantClient {
  private baseUrl: string;

  constructor(config: { url: string }) {
    this.baseUrl = config.url.replace(/\/$/, ''); // Remove trailing slash
  }

  async getCollections(): Promise<QdrantCollectionsResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/collections`);
      return response.data;
    } catch (error) {
      console.error('Error getting collections:', error);
      throw error;
    }
  }

  async getCollection(collectionName: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/collections/${collectionName}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  async search(
    collectionName: string,
    params: {
      vector: number[];
      limit: number;
      with_payload?: boolean;
      with_vector?: boolean;
    }
  ): Promise<QdrantSearchResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/collections/${collectionName}/points/search`, {
        vector: params.vector,
        limit: params.limit,
        with_payload: params.with_payload ?? true,
        with_vector: params.with_vector ?? false,
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching collection ${collectionName}:`, error);
      throw error;
    }
  }

  async upsert(
    collectionName: string,
    points: QdrantPoint[]
  ): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/collections/${collectionName}/points`, {
        points: points,
      });
      return response.data;
    } catch (error) {
      console.error(`Error upserting points in collection ${collectionName}:`, error);
      throw error;
    }
  }

  async createCollection(
    collectionName: string,
    vectorSize: number
  ): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/collections/${collectionName}`, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteCollection(collectionName: string): Promise<any> {
    try {
      const response = await axios.delete(`${this.baseUrl}/collections/${collectionName}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting collection ${collectionName}:`, error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}`);
      return response.status === 200;
    } catch (error) {
      console.error('Qdrant health check failed:', error);
      return false;
    }
  }
}
