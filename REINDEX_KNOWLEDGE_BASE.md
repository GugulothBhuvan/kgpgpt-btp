# Re-indexing Knowledge Base with New Files

This guide will help you replace the current knowledge base (JSON folders) with your new files (2 TXT files + 1 PDF).

## Current Setup
- **Collection 1**: `metakgp_pages` (472 documents from JSON files)
- **Collection 2**: `iitkgp_pages` (100 documents from JSON files)

## New Setup
- **Single Collection**: `kgp_knowledge_base` (from TXT and PDF files)

---

## Step 1: Prepare Your Files

1. Make sure your files are in the `kgpgpt/data/` directory:
   ```
   kgpgpt/data/
   ├── merged_output.txt      ← First TXT file
   ├── merged_docs.txt         ← Second TXT file
   └── merged_kgpdocs.pdf      ← PDF file
   ```

2. **Edit the file paths** in `kgpgpt/scripts/load-text-knowledge-base.js` if your files are named differently:
   ```javascript
   const FILES_TO_INDEX = [
     './data/merged_output.txt',      // Change this
     './data/merged_docs.txt',         // Change this
     './data/merged_kgpdocs.pdf'       // Change this
   ];
   ```

---

## Step 2: Install PDF Parser (if using PDF)

If you're loading PDF files, install the pdf-parse library:

```bash
cd kgpgpt
npm install pdf-parse
```

Then update the PDF extraction function in `load-text-knowledge-base.js`:

```javascript
async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`❌ Failed to extract PDF: ${error.message}`);
    return '';
  }
}
```

---

## Step 3: Run the Re-indexing Script

```bash
cd kgpgpt
node scripts/load-text-knowledge-base.js
```

**What this does:**
- Creates a new collection called `kgp_knowledge_base`
- Reads your TXT and PDF files
- Chunks large texts into 1000-character pieces (with 200-char overlap)
- Generates embeddings for each chunk
- Indexes everything into Qdrant

**Expected Output:**
```
🚀 KGP GPT - Text Knowledge Base Loader
=========================================

✅ Qdrant is running

📚 Setting up collection...
Creating collection: kgp_knowledge_base
✅ Collection created successfully

📖 Indexing knowledge base files...

📄 Loading file: D:\BTP-NeerajGoyal\kgpgpt\data\merged_output.txt
📊 File size: 23456.78 KB
📦 Split into 1234 chunks
✅ Indexed batch 1/13 from merged_output.txt
...
✅ Completed merged_output.txt: 1234 chunks indexed

📄 Loading file: D:\BTP-NeerajGoyal\kgpgpt\data\merged_docs.txt
...
```

---

## Step 4: Update Retriever Agent Configuration

You need to tell the retriever agent to use the new collection instead of the old dual collections.

**Option A: Use Environment Variable**

In your `.env.local` file, update:
```env
QDRANT_COLLECTION=kgp_knowledge_base
```

**Option B: Modify Code**

Check `kgpgpt/lib/utils/qdrant-client.ts` or wherever the retriever is initialized, and change:
```typescript
// From:
const QDRANT_COLLECTION_METAKGP = 'metakgp_pages';
const QDRANT_COLLECTION_IITKGP = 'iitkgp_pages';

// To:
const QDRANT_COLLECTION = 'kgp_knowledge_base';
```

---

## Step 5: Update Retriever Agent (if needed)

If your `retriever-agent.ts` searches both collections, update it to search only one:

Find the file: `kgpgpt/lib/agents/retriever-agent.ts`

Change from:
```typescript
// Search both collections
const metakgpResults = await this.searchCollection(METAKGP_COLLECTION, query);
const iitkgpResults = await this.searchCollection(IITKGP_COLLECTION, query);
```

To:
```typescript
// Search single collection
const results = await this.searchCollection('kgp_knowledge_base', query);
```

---

## Step 6: Restart Your Application

```bash
# Stop the current server (Ctrl+C)
cd kgpgpt
npm run dev
```

---

## Step 7: Test the New Knowledge Base

1. Open your chatbot in the browser
2. Ask a question that should be answered from your new files
3. Check if the retriever finds relevant information

---

## Troubleshooting

### Issue: "PDF extraction failed"
- Install `pdf-parse`: `npm install pdf-parse`
- Update the `extractTextFromPDF` function as shown in Step 2

### Issue: "File not found"
- Check that your files are in `kgpgpt/data/`
- Verify file names match exactly in `FILES_TO_INDEX` array

### Issue: "Qdrant connection failed"
- Make sure Docker is running
- Check Qdrant container: `docker ps`
- Start Qdrant if needed: `docker run -d -p 6333:6333 --name qdrant-kgpgpt qdrant/qdrant`

### Issue: "No results from knowledge base"
- Check collection exists: `curl http://localhost:6333/collections`
- Verify points were indexed: `curl http://localhost:6333/collections/kgp_knowledge_base`
- Make sure retriever-agent.ts is using the new collection name

---

## Clean Up (Optional)

After confirming the new knowledge base works, you can delete the old collections:

```bash
# Delete old collections
curl -X DELETE http://localhost:6333/collections/metakgp_pages
curl -X DELETE http://localhost:6333/collections/iitkgp_pages
```

---

## File Structure After Setup

```
kgpgpt/
├── data/
│   ├── merged_output.txt      ← Indexed
│   ├── merged_docs.txt         ← Indexed
│   ├── merged_kgpdocs.pdf      ← Indexed
│   └── (old folders - can be archived)
├── scripts/
│   ├── load-text-knowledge-base.js  ← NEW script
│   └── load-dual-knowledge-base.js  ← OLD script (keep for reference)
└── lib/
    └── agents/
        └── retriever-agent.ts  ← Update to use new collection
```

---

## Need Help?

If you encounter any issues during re-indexing, check:
1. Qdrant logs: `docker logs qdrant-kgpgpt`
2. Script output for specific error messages
3. File encoding (should be UTF-8 for TXT files)

