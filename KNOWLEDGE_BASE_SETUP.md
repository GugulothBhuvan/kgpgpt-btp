# Knowledge Base Setup Guide

## Current Structure
Your knowledge base files are currently located in:
```
BTP-NeerajGoyal/
├── data/
│   └── metakgp_pages/          ← Your 470+ JSON files are here
│       ├── w_Resources_for_software_development.json
│       ├── w_IIT_Kharagpur.json
│       └── ... (470+ files)
├── kgpgpt/                      ← Your chatbot application
```

## Option 1: Keep Current Structure (Recommended)
Keep your files where they are and use the default configuration.

**Steps:**
1. Make sure Qdrant is running: `docker run -d -p 6333:6333 qdrant/qdrant`
2. Load your knowledge base: `npm run load-kb`
3. Start your chatbot: `npm run dev`

## Option 2: Move Knowledge Base to kgpgpt Directory
If you prefer to keep everything in one place:

**Steps:**
1. Create a data directory in kgpgpt: `mkdir kgpgpt/data`
2. Copy your metakgp_pages folder: `cp -r data/metakgp_pages kgpgpt/data/`
3. Set environment variable: `KNOWLEDGE_BASE_PATH=./data/metakgp_pages`
4. Load knowledge base: `npm run load-kb`
5. Start chatbot: `npm run dev`

## Environment Variables
You can customize the setup using these environment variables:

```bash
# In your .env.local file:
KNOWLEDGE_BASE_PATH=../data/metakgp_pages  # Path to your JSON files
QDRANT_COLLECTION_NAME=metakgp_pages       # Collection name in Qdrant
QDRANT_URL=http://localhost:6333           # Qdrant server URL
```

## Loading Your Knowledge Base

### Method 1: Using npm script
```bash
npm run load-kb
```

### Method 2: Direct execution
```bash
node scripts/load-knowledge-base.js
```

### Method 3: With custom path
```bash
KNOWLEDGE_BASE_PATH=../data/metakgp_pages node scripts/load-knowledge-base.js
```

## What the Script Does
1. **Connects to Qdrant** - Verifies the database is running
2. **Creates Collection** - Sets up the `metakgp_pages` collection
3. **Loads JSON Files** - Reads all your knowledge base files
4. **Generates Embeddings** - Creates vector representations of your content
5. **Indexes in Qdrant** - Stores everything in the vector database

## Expected Output
```
🚀 KGP GPT - Knowledge Base Loader
=====================================

✅ Qdrant is running
Creating collection: metakgp_pages
✅ Collection created successfully
📁 Loading knowledge base from: /path/to/your/data/metakgp_pages
📚 Found 470 JSON files to index
📦 Processing batch 1/10
✅ Indexed 50 documents (Total: 50)
...
🎉 Successfully indexed 470 documents

🎯 Next Steps:
1. Start your chatbot: npm run dev
2. Test with a question in the chat interface
3. Your chatbot now has access to the knowledge base!
```

## Troubleshooting

### "Knowledge base path not found"
- Check the `KNOWLEDGE_BASE_PATH` environment variable
- Verify the path exists relative to the kgpgpt directory
- Use absolute paths if needed

### "Cannot connect to Qdrant"
- Make sure Qdrant is running: `docker ps`
- Start Qdrant: `docker run -d -p 6333:6333 qdrant/qdrant`
- Check the port isn't blocked

### "Failed to index documents"
- Check file permissions
- Verify JSON files are valid
- Check Qdrant logs for errors

## After Loading
Once your knowledge base is loaded:
1. Your chatbot will have access to all 470+ metakgp pages
2. It can answer questions about IIT Kharagpur, departments, procedures, etc.
3. Responses will be based on the actual content from your knowledge base
4. The chatbot will work for both simple queries ("hey") and complex questions
