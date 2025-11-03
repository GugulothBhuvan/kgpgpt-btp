#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'kgp_knowledge_base';

// File paths - YOU CAN MODIFY THESE
const FILES_TO_INDEX = [
  './data/merged_output.txt',      // First TXT file
  './data/merged_docs.txt',         // Second TXT file
  './data/merged_kgpdocs.pdf'       // PDF file
];

// Simple text embedding function (placeholder - same as before)
function generateSimpleEmbedding(text) {
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const embedding = new Array(768).fill(0);
  const hashStr = Math.abs(hash).toString();
  for (let i = 0; i < Math.min(hashStr.length, 768); i++) {
    embedding[i] = (parseInt(hashStr[i]) - 0) / 9;
  }
  
  return embedding;
}

// Chunk text into smaller pieces for better retrieval
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += (chunkSize - overlap);
  }
  
  return chunks;
}

// Extract text from PDF using simple parsing (for basic PDFs)
async function extractTextFromPDF(filePath) {
  try {
    // For PDF extraction, you'd need pdf-parse or similar library
    // For now, we'll just read it as binary and extract what we can
    console.log('⚠️  PDF extraction requires pdf-parse library. Install it with: npm install pdf-parse');
    console.log('⚠️  For now, skipping PDF or treating as text...');
    
    // Try to read as text (will work for text-based PDFs)
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`❌ Failed to extract PDF: ${error.message}`);
    return '';
  }
}

async function createCollection(collectionName) {
  try {
    console.log(`Creating collection: ${collectionName}`);
    
    // Delete existing collection if it exists
    try {
      await axios.delete(`${QDRANT_URL}/collections/${collectionName}`);
      console.log('🗑️  Deleted existing collection');
    } catch (error) {
      // Collection doesn't exist, that's fine
    }
    
    const response = await axios.put(`${QDRANT_URL}/collections/${collectionName}`, {
      vectors: {
        size: 768,
        distance: 'Cosine'
      }
    });
    
    console.log('✅ Collection created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create collection:', error.message);
    return false;
  }
}

async function indexFile(filePath, startIndex) {
  try {
    const resolvedPath = path.resolve(__dirname, '..', filePath);
    console.log(`📄 Loading file: ${resolvedPath}`);
    
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ File not found: ${resolvedPath}`);
      return { documents: [], count: 0 };
    }
    
    let content = '';
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Read file based on type
    if (fileExt === '.pdf') {
      content = await extractTextFromPDF(resolvedPath);
    } else if (fileExt === '.txt') {
      content = fs.readFileSync(resolvedPath, 'utf8');
    } else {
      console.error(`❌ Unsupported file type: ${fileExt}`);
      return { documents: [], count: 0 };
    }
    
    if (!content || content.length === 0) {
      console.error(`❌ No content extracted from: ${fileName}`);
      return { documents: [], count: 0 };
    }
    
    console.log(`📊 File size: ${(content.length / 1024).toFixed(2)} KB`);
    
    // Chunk the text
    const chunks = chunkText(content, 1000, 200);
    console.log(`📦 Split into ${chunks.length} chunks`);
    
    // Create documents
    const documents = chunks.map((chunk, index) => {
      const embedding = generateSimpleEmbedding(chunk);
      return {
        id: startIndex + index,
        vector: embedding,
        payload: {
          title: `${fileName} - Chunk ${index + 1}`,
          content: chunk,
          source: fileName,
          chunkIndex: index,
          totalChunks: chunks.length,
          timestamp: new Date().toISOString()
        }
      };
    });
    
    return { documents, count: chunks.length };
    
  } catch (error) {
    console.error(`❌ Failed to process file ${filePath}:`, error.message);
    return { documents: [], count: 0 };
  }
}

async function indexAllFiles(collectionName, files) {
  try {
    console.log(`📚 Indexing ${files.length} files...`);
    
    let totalIndexed = 0;
    const batchSize = 100;
    
    for (const file of files) {
      const { documents, count } = await indexFile(file, totalIndexed);
      
      if (documents.length === 0) {
        console.log(`⚠️  Skipping ${file} (no content)`);
        continue;
      }
      
      // Index in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        try {
          await axios.put(`${QDRANT_URL}/collections/${collectionName}/points`, {
            points: batch
          });
          
          console.log(`✅ Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)} from ${path.basename(file)}`);
        } catch (error) {
          console.error(`❌ Failed to index batch:`, error.message);
          if (error.response) {
            console.error('Response data:', error.response.data);
          }
        }
      }
      
      totalIndexed += count;
      console.log(`✅ Completed ${path.basename(file)}: ${count} chunks indexed\n`);
    }
    
    console.log(`🎉 Successfully indexed ${totalIndexed} total chunks from ${files.length} files`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to index files:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 KGP GPT - Text Knowledge Base Loader');
  console.log('=========================================\n');
  
  // Check Qdrant connection
  try {
    await axios.get(`${QDRANT_URL}`);
    console.log('✅ Qdrant is running\n');
  } catch (error) {
    console.error('❌ Cannot connect to Qdrant. Make sure it\'s running on:', QDRANT_URL);
    console.log('💡 Start Qdrant with: docker run -p 6333:6333 qdrant/qdrant');
    return;
  }
  
  // Create collection
  console.log('📚 Setting up collection...');
  const created = await createCollection(COLLECTION_NAME);
  
  if (!created) {
    console.error('❌ Failed to create collection');
    return;
  }
  
  // Index files
  console.log('\n📖 Indexing knowledge base files...\n');
  const success = await indexAllFiles(COLLECTION_NAME, FILES_TO_INDEX);
  
  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('1. Update your retriever-agent.ts to use collection:', COLLECTION_NAME);
    console.log('2. Start your chatbot: npm run dev');
    console.log('3. Test with a question in the chat interface');
    console.log('4. Your chatbot now has access to the new knowledge base!');
  } else {
    console.log('\n❌ Failed to load knowledge base. Check the errors above.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createCollection, indexAllFiles };

