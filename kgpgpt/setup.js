#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 KGP GPT - Multi-Agent RAG Chatbot Setup');
console.log('=============================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists');
} else {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Serper API Configuration (for web search)
SERPER_API_KEY=your_serper_api_key_here

# Qdrant Vector Database Configuration
QDRANT_URL=http://localhost:6333

# Optional: Override default collection name
# QDRANT_COLLECTION_NAME=metakgp_pages
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created successfully');
  console.log('⚠️  Please edit .env.local with your actual API keys');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ Dependencies already installed');
} else {
  console.log('📦 Installing dependencies...');
  console.log('   Run: npm install');
}

// Check if Qdrant is running
console.log('\n🔍 Checking Qdrant connection...');
const http = require('http');
const qdrantUrl = 'http://localhost:6333';

const req = http.get(qdrantUrl, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Qdrant is running on http://localhost:6333');
  } else {
    console.log('⚠️  Qdrant responded with status:', res.statusCode);
  }
});

req.on('error', (err) => {
  console.log('❌ Qdrant is not running on http://localhost:6333');
  console.log('   To start Qdrant with Docker:');
  console.log('   docker run -p 6333:6333 qdrant/qdrant');
  console.log('\n   Or follow the installation guide:');
  console.log('   https://qdrant.tech/documentation/guides/installation/');
});

req.setTimeout(5000, () => {
  console.log('❌ Qdrant connection timeout');
  req.destroy();
});

console.log('\n📋 Next Steps:');
console.log('1. Edit .env.local with your API keys');
console.log('2. Ensure Qdrant is running');
console.log('3. Run: npm run dev');
console.log('4. Open http://localhost:3000 in your browser');
console.log('\n📚 For more information, see README.md');
