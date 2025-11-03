#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'metakgp_pages';
const KNOWLEDGE_BASE_PATH = process.env.KNOWLEDGE_BASE_PATH || '../data/metakgp_pages';

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

async function createCollection() {
  try {
    console.log(`Creating collection: ${COLLECTION_NAME}`);
    
    const response = await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
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

async function loadDocument(filePath, index) {
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
    const source = data.source || 'metakgp';
    
    // Generate embedding
    const embedding = generateSimpleEmbedding(content_text);
    
    return {
      id: index, // Use numeric ID instead of filename
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

async function indexDocuments() {
  try {
    const knowledgeBasePath = path.resolve(__dirname, KNOWLEDGE_BASE_PATH);
    console.log(`📁 Loading knowledge base from: ${knowledgeBasePath}`);
    
    if (!fs.existsSync(knowledgeBasePath)) {
      console.error(`❌ Knowledge base path not found: ${knowledgeBasePath}`);
      console.log('💡 Set KNOWLEDGE_BASE_PATH environment variable or move your data folder');
      return false;
    }
    
    const files = fs.readdirSync(knowledgeBasePath).filter(file => file.endsWith('.json'));
    console.log(`📚 Found ${files.length} JSON files to index`);
    
    if (files.length === 0) {
      console.log('❌ No JSON files found in knowledge base directory');
      return false;
    }
    
    // Load and index documents in batches
    const batchSize = 50;
    let indexedCount = 0;
    
    for (let i = 0; i < files.length; i += batchSize) { // Process all batches
      const batch = files.slice(i, i + batchSize);
      const documents = [];
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
      
      for (let j = 0; j < batch.length; j++) {
        const file = batch[j];
        const filePath = path.join(knowledgeBasePath, file);
        const document = await loadDocument(filePath, indexedCount + j);
        if (document) {
          documents.push(document);
        }
      }
      
      if (documents.length > 0) {
        try {
          // Use direct axios call with proper Qdrant format
          const response = await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
            points: documents
          });
          
          indexedCount += documents.length;
          console.log(`✅ Indexed ${documents.length} documents (Total: ${indexedCount})`);
        } catch (error) {
          console.error(`❌ Failed to index batch:`, error.message);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          }
        }
      }
    }
    
    console.log(`🎉 Successfully indexed ${indexedCount} documents`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to index documents:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 KGP GPT - Knowledge Base Loader');
  console.log('=====================================\n');
  
  // Check Qdrant connection
  try {
    await axios.get(`${QDRANT_URL}`);
    console.log('✅ Qdrant is running');
  } catch (error) {
    console.error('❌ Cannot connect to Qdrant. Make sure it\'s running on:', QDRANT_URL);
    console.log('💡 Start Qdrant with: docker run -p 6333:6333 qdrant/qdrant');
    return;
  }
  
  // Create collection
  const collectionCreated = await createCollection();
  if (!collectionCreated) {
    return;
  }
  
  // Index documents
  const success = await indexDocuments();
  
  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('1. Start your chatbot: npm run dev');
    console.log('2. Test with a question in the chat interface');
    console.log('3. Your chatbot now has access to the knowledge base!');
  } else {
    console.log('\n❌ Failed to load knowledge base. Check the errors above.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createCollection, indexDocuments };
