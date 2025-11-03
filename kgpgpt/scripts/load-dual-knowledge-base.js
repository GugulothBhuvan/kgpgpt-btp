#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const METAKGP_COLLECTION = process.env.QDRANT_COLLECTION_METAKGP || 'metakgp_pages';
const IITKGP_COLLECTION = process.env.QDRANT_COLLECTION_IITKGP || 'iitkgp_pages';
const METAKGP_PATH = process.env.METAKGP_PATH || './data/metakgp_pages';
const IITKGP_PATH = process.env.IITKGP_PATH || './data/iitkgp_pages';

// Simple text embedding function (placeholder - you should use a proper embedding model)
function generateSimpleEmbedding(text) {
  // This is a placeholder - in production, use a proper embedding model
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const embedding = new Array(768).fill(0);
  const hashStr = Math.abs(hash).toString();
  for (let i = 0; i < Math.min(hashStr.length, 768); i++) {
    embedding[i] = (parseInt(hashStr[i]) - 0) / 9; // Normalize to 0-1 range
  }
  
  return embedding;
}

async function createCollection(collectionName) {
  try {
    console.log(`Creating collection: ${collectionName}`);
    
    const response = await axios.put(`${QDRANT_URL}/collections/${collectionName}`, {
      vectors: {
        size: 768,
        distance: 'Cosine'
      }
    });
    
    console.log('✅ Collection created successfully');
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Collection already exists');
      return true;
    }
    console.error('❌ Failed to create collection:', error.message);
    return false;
  }
}

async function loadDocument(filePath, index, source) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Extract relevant information from the JSON
    const title = data.title || path.basename(filePath, '.json');
    
    // Handle content field - it can be an array of strings or a single string
    let content_text = '';
    if (Array.isArray(data.content)) {
      content_text = data.content.join(' ');
    } else if (typeof data.content === 'string') {
      content_text = data.content;
    } else {
      content_text = JSON.stringify(data);
    }
    
    const url = data.url || '';
    
    // Generate embedding
    const embedding = generateSimpleEmbedding(content_text);
    
    return {
      id: index, // Use integer ID instead of string ID
      vector: embedding,
      payload: {
        title,
        content: content_text,
        url,
        source,
        filename: path.basename(filePath),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`❌ Failed to load ${filePath}:`, error.message);
    return null;
  }
}

async function indexCollection(collectionName, knowledgeBasePath, source) {
  try {
    const resolvedPath = path.resolve(__dirname, '..', knowledgeBasePath);
    console.log(`📁 Loading ${source} knowledge base from: ${resolvedPath}`);
    
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ ${source} knowledge base path not found: ${resolvedPath}`);
      return false;
    }
    
    const files = fs.readdirSync(resolvedPath).filter(file => file.endsWith('.json'));
    console.log(`📚 Found ${files.length} JSON files to index in ${source}`);
    
    if (files.length === 0) {
      console.log(`❌ No JSON files found in ${source} directory`);
      return false;
    }
    
    // Load and index documents in batches
    const batchSize = 50;
    let indexedCount = 0;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const documents = [];
      
      console.log(`📦 Processing ${source} batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
      
      for (let j = 0; j < batch.length; j++) {
        const file = batch[j];
        const filePath = path.join(resolvedPath, file);
        const document = await loadDocument(filePath, indexedCount + j, source);
        if (document) {
          documents.push(document);
        }
      }
      
      if (documents.length > 0) {
        try {
          // Use direct axios call with proper Qdrant format
          const response = await axios.put(`${QDRANT_URL}/collections/${collectionName}/points`, {
            points: documents
          });
          
          indexedCount += documents.length;
          console.log(`✅ Indexed ${documents.length} documents to ${collectionName} (Total: ${indexedCount})`);
        } catch (error) {
          console.error(`❌ Failed to index ${source} batch:`, error.message);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          }
        }
      }
    }
    
    console.log(`🎉 Successfully indexed ${indexedCount} documents to ${collectionName}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to index ${source} documents:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 KGP GPT - Dual Knowledge Base Loader');
  console.log('==========================================\n');
  
  // Check Qdrant connection
  try {
    await axios.get(`${QDRANT_URL}`);
    console.log('✅ Qdrant is running');
  } catch (error) {
    console.error('❌ Cannot connect to Qdrant. Make sure it\'s running on:', QDRANT_URL);
    console.log('💡 Start Qdrant with: docker run -p 6333:6333 qdrant/qdrant');
    return;
  }
  
  // Create both collections
  console.log('\n📚 Setting up collections...');
  const metakgpCreated = await createCollection(METAKGP_COLLECTION);
  const iitkgpCreated = await createCollection(IITKGP_COLLECTION);
  
  if (!metakgpCreated || !iitkgpCreated) {
    console.error('❌ Failed to create collections');
    return;
  }
  
  // Index both knowledge bases
  console.log('\n📖 Indexing knowledge bases...');
  
  const metakgpSuccess = await indexCollection(METAKGP_COLLECTION, METAKGP_PATH, 'metakgp');
  const iitkgpSuccess = await indexCollection(IITKGP_COLLECTION, IITKGP_PATH, 'iitkgp');
  
  if (metakgpSuccess && iitkgpSuccess) {
    console.log('\n🎯 Next Steps:');
    console.log('1. Start your chatbot: npm run dev');
    console.log('2. Test with a question in the chat interface');
    console.log('3. Your chatbot now has access to both knowledge bases!');
    console.log(`4. MetakGP collection: ${METAKGP_COLLECTION}`);
    console.log(`5. IITKGP collection: ${IITKGP_COLLECTION}`);
  } else {
    console.log('\n❌ Failed to load one or more knowledge bases. Check the errors above.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createCollection, indexCollection };
