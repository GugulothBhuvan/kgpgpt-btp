# Complete Guide: Switch to New Knowledge Base (TXT + PDF Files)

## 📋 Overview

You want to replace the current knowledge base structure:
- **OLD**: 2 folders with JSON files (`metakgp_pages` + `iitkgp_pages`)
- **NEW**: 2 TXT files + 1 PDF file (`merged_output.txt`, `merged_docs.txt`, `merged_kgpdocs.pdf`)

---

## 🎯 Step-by-Step Instructions

### Step 1: Install PDF Parser Library

```bash
cd kgpgpt
npm install pdf-parse
```

### Step 2: Update the Indexing Script

Open `kgpgpt/scripts/load-text-knowledge-base.js` and update the PDF extraction function:

**Find this function (around line 40):**
```javascript
async function extractTextFromPDF(filePath) {
  try {
    // For PDF extraction, you'd need pdf-parse or similar library
    console.log('⚠️  PDF extraction requires pdf-parse library...');
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`❌ Failed to extract PDF: ${error.message}`);
    return '';
  }
}
```

**Replace with:**
```javascript
async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    console.log(`✅ Extracted ${data.numpages} pages from PDF`);
    return data.text;
  } catch (error) {
    console.error(`❌ Failed to extract PDF: ${error.message}`);
    return '';
  }
}
```

### Step 3: Verify Your File Paths

Check that your files are in the correct location:

```
kgpgpt/
└── data/
    ├── merged_output.txt      ← Should exist
    ├── merged_docs.txt         ← Should exist
    └── merged_kgpdocs.pdf      ← Should exist
```

If your files are in a different location or have different names, edit line 11-15 in `load-text-knowledge-base.js`:

```javascript
const FILES_TO_INDEX = [
  './data/YOUR_FIRST_FILE.txt',    // Update this
  './data/YOUR_SECOND_FILE.txt',   // Update this
  './data/YOUR_PDF_FILE.pdf'        // Update this
];
```

### Step 4: Run the Indexing Script

```bash
cd kgpgpt
node scripts/load-text-knowledge-base.js
```

**Expected Output:**
```
🚀 KGP GPT - Text Knowledge Base Loader
=========================================

✅ Qdrant is running

📚 Setting up collection...
Creating collection: kgp_knowledge_base
🗑️  Deleted existing collection
✅ Collection created successfully

📖 Indexing knowledge base files...

📄 Loading file: D:\BTP-NeerajGoyal\kgpgpt\data\merged_output.txt
📊 File size: 23456.78 KB
📦 Split into 1234 chunks
✅ Indexed batch 1/13 from merged_output.txt
✅ Indexed batch 2/13 from merged_output.txt
...
✅ Completed merged_output.txt: 1234 chunks indexed

📄 Loading file: D:\BTP-NeerajGoyal\kgpgpt\data\merged_docs.txt
📊 File size: 12345.67 KB
📦 Split into 678 chunks
...
✅ Completed merged_docs.txt: 678 chunks indexed

📄 Loading file: D:\BTP-NeerajGoyal\kgpgpt\data\merged_kgpdocs.pdf
✅ Extracted 500 pages from PDF
📊 File size: 5678.90 KB
📦 Split into 345 chunks
...
✅ Completed merged_kgpdocs.pdf: 345 chunks indexed

🎉 Successfully indexed 2257 total chunks from 3 files
```

### Step 5: Update Environment Variables

Add this to your `.env.local` file:

```env
# New unified knowledge base collection
QDRANT_COLLECTION=kgp_knowledge_base
```

### Step 6: Update Configuration

**Option A: Use Environment Variable (Recommended)**

Your `.env.local` should now have:
```env
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=kgp_knowledge_base
```

**Option B: Modify Code Directly**

Edit `kgpgpt/app/api/query/route.ts` line 67:

**From:**
```typescript
const retrieverAgent = new RetrieverAgent(qdrantClient, config.qdrant.collections.metakgp);
```

**To:**
```typescript
const retrieverAgent = new RetrieverAgent(qdrantClient, 'kgp_knowledge_base');
```

### Step 7: Restart Your Application

```bash
# Stop the current dev server (Ctrl+C in terminal)
cd kgpgpt
npm run dev
```

Wait for:
```
✓ Ready in 3.2s
○ Local:        http://localhost:3000
```

### Step 8: Test the New Knowledge Base

1. Open browser: http://localhost:3000
2. Log in to your application
3. Ask a question that should be answered from your new files
4. Check the response

**Example test questions:**
- "Tell me about [something specific from your TXT files]"
- "What information do you have about [topic from PDF]?"

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check Qdrant is running
docker ps | grep qdrant

# 2. Check new collection exists
curl http://localhost:6333/collections

# 3. Check collection has data
curl http://localhost:6333/collections/kgp_knowledge_base

# 4. Should see something like:
# "points_count": 2257  (or whatever your total chunk count was)
```

---

## 🧹 Clean Up Old Collections (Optional)

After confirming the new knowledge base works perfectly:

```bash
# Delete old collections
curl -X DELETE http://localhost:6333/collections/metakgp_pages
curl -X DELETE http://localhost:6333/collections/iitkgp_pages
```

You can also archive the old JSON folders:

```bash
cd kgpgpt/data
mkdir _archived
mv metakgp_pages _archived/
mv iitkgp_pages _archived/
```

---

## 🔧 Troubleshooting

### Issue: "pdf-parse not found"
```bash
cd kgpgpt
npm install pdf-parse
```

### Issue: "File not found"
- Check file paths in `FILES_TO_INDEX` array
- Verify files exist: `ls kgpgpt/data/`
- Make sure no typos in file names

### Issue: "Cannot connect to Qdrant"
```bash
# Check if Docker is running
docker ps

# If Qdrant not running, start it:
docker run -d -p 6333:6333 --name qdrant-kgpgpt qdrant/qdrant
```

### Issue: "No results from knowledge base"
```bash
# Verify collection has data
curl http://localhost:6333/collections/kgp_knowledge_base

# Check "points_count" should be > 0
# If 0, re-run the indexing script
```

### Issue: "Retriever still degraded"
- Wait 10 seconds after indexing completes
- Restart the Next.js dev server
- Check Qdrant collection status (should be "green")

---

## 📊 What Happened Under the Hood

### Data Transformation

**Before:**
```
metakgp_pages/
├── page1.json → 1 document
├── page2.json → 1 document
└── ...
Total: 472 documents

iitkgp_pages/
├── page1.json → 1 document
├── page2.json → 1 document
└── ...
Total: 100 documents
```

**After:**
```
merged_output.txt → 1234 chunks (1000 chars each, 200 overlap)
merged_docs.txt   → 678 chunks
merged_kgpdocs.pdf → 345 chunks
Total: 2257 chunks
```

### Why Chunking?

Large text files are split into 1000-character chunks with 200-character overlap because:
- ✅ Better retrieval accuracy (finds specific sections)
- ✅ More relevant search results
- ✅ Prevents token limit issues
- ✅ Maintains context with overlap

---

## 🎯 Success Indicators

You'll know it worked when:

1. ✅ Script completes without errors
2. ✅ Collection `kgp_knowledge_base` exists in Qdrant
3. ✅ `points_count` matches your total chunks
4. ✅ Chatbot answers questions from your new files
5. ✅ System health shows "Retriever: healthy"

---

## 📞 Need More Help?

If you encounter issues:
1. Check the console output for specific error messages
2. Verify Qdrant logs: `docker logs qdrant-kgpgpt`
3. Check Next.js terminal output for agent logs
4. Ensure all environment variables are set correctly

---

## 🚀 What's Next?

After successfully switching to the new knowledge base:

1. **Test thoroughly** with various questions
2. **Monitor retrieval quality** - are answers accurate?
3. **Adjust chunk size** if needed (in `load-text-knowledge-base.js` line 47)
4. **Add more files** easily by updating `FILES_TO_INDEX` array
5. **Re-index anytime** by running the script again

---

## Summary of All Files Modified

- ✅ `scripts/load-text-knowledge-base.js` - NEW (indexing script)
- ⚠️ `scripts/load-text-knowledge-base.js` - UPDATE (PDF function)
- ⚠️ `.env.local` - ADD (`QDRANT_COLLECTION=kgp_knowledge_base`)
- ⚠️ `app/api/query/route.ts` - UPDATE (line 67, optional if using env var)

Enjoy your new unified knowledge base! 🎉

