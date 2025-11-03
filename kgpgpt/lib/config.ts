export interface Config {
  gemini: {
    apiKey: string;
    model: string;
  };
  serper: {
    apiKey: string;
    baseUrl: string;
  };
  brightdata: {
    apiKey: string;
    username: string;
    password: string;
    baseUrl: string;
  };
  deepgram: {
    apiKey: string;
    baseUrl: string;
  };
  qdrant: {
    url: string;
    collections: {
      metakgp: string;
      iitkgp: string;
    };
    vectorSize: number;
  };
  system: {
    maxRetrievalResults: number;
    maxWebSearchResults: number;
    enableCaching: boolean;
    requestTimeout: number;
    defaultCollection: string;
  };
}

export const defaultConfig: Config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-pro'
  },
  serper: {
    apiKey: process.env.SERPER_API_KEY || '',
    baseUrl: 'https://google.serper.dev/search'
  },
  brightdata: {
    apiKey: process.env.BRIGHTDATA_API_KEY || '',
    username: process.env.BRIGHTDATA_USERNAME || '',
    password: process.env.BRIGHTDATA_PASSWORD || '',
    baseUrl: 'https://api.brightdata.com'
  },
  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY || '',
    baseUrl: 'https://api.deepgram.com'
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collections: {
      metakgp: process.env.QDRANT_COLLECTION_METAKGP || 'metakgp_pages',
      iitkgp: process.env.QDRANT_COLLECTION_IITKGP || 'iitkgp_pages'
    },
    vectorSize: 768
  },
  system: {
    maxRetrievalResults: 5,
    maxWebSearchResults: 5,
    enableCaching: true,
    requestTimeout: 30000,
    defaultCollection: process.env.DEFAULT_COLLECTION || 'metakgp'
  }
};

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];
  
  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }
  
  if (!config.serper.apiKey) {
    errors.push('SERPER_API_KEY is required for web search functionality');
  }
  
  // BrightData is optional but if provided, all credentials should be present
  if (config.brightdata.apiKey && 
      config.brightdata.apiKey !== 'your_brightdata_api_key_here' && 
      (!config.brightdata.username || !config.brightdata.password)) {
    errors.push('BRIGHTDATA_USERNAME and BRIGHTDATA_PASSWORD are required when BRIGHTDATA_API_KEY is provided');
  }
  
  if (!config.qdrant.url) {
    errors.push('QDRANT_URL is required');
  }
  
  if (!config.qdrant.collections.metakgp) {
    errors.push('QDRANT_COLLECTION_METAKGP is required');
  }
  
  if (!config.qdrant.collections.iitkgp) {
    errors.push('QDRANT_COLLECTION_IITKGP is required');
  }
  
  if (config.system.maxRetrievalResults < 1 || config.system.maxRetrievalResults > 20) {
    errors.push('maxRetrievalResults must be between 1 and 20');
  }
  
  if (config.system.maxWebSearchResults < 1 || config.system.maxWebSearchResults > 10) {
    errors.push('maxWebSearchResults must be between 1 and 10');
  }
  
  return errors;
}

export function getConfig(): Config {
  const config = { ...defaultConfig };
  
  // Override with environment variables if present
  if (process.env.GEMINI_API_KEY) {
    config.gemini.apiKey = process.env.GEMINI_API_KEY;
  }
  
  if (process.env.SERPER_API_KEY) {
    config.serper.apiKey = process.env.SERPER_API_KEY;
  }
  
  if (process.env.BRIGHTDATA_API_KEY) {
    config.brightdata.apiKey = process.env.BRIGHTDATA_API_KEY;
  }
  
  if (process.env.BRIGHTDATA_USERNAME) {
    config.brightdata.username = process.env.BRIGHTDATA_USERNAME;
  }
  
  if (process.env.BRIGHTDATA_PASSWORD) {
    config.brightdata.password = process.env.BRIGHTDATA_PASSWORD;
  }
  
  if (process.env.DEEPGRAM_API_KEY) {
    config.deepgram.apiKey = process.env.DEEPGRAM_API_KEY;
  }
  
  if (process.env.QDRANT_URL) {
    config.qdrant.url = process.env.QDRANT_URL;
  }
  
  if (process.env.QDRANT_COLLECTION_METAKGP) {
    config.qdrant.collections.metakgp = process.env.QDRANT_COLLECTION_METAKGP;
  }
  
  if (process.env.QDRANT_COLLECTION_IITKGP) {
    config.qdrant.collections.iitkgp = process.env.QDRANT_COLLECTION_IITKGP;
  }
  
  if (process.env.DEFAULT_COLLECTION) {
    config.system.defaultCollection = process.env.DEFAULT_COLLECTION;
  }
  
  return config;
}
