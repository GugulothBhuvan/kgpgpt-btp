# File Upload Feature - User Guide

## Overview
KGPGPT now supports uploading and analyzing documents! You can upload PDF, DOCX, or TXT files and ask questions about their content.

## Features

### Supported File Formats
- **PDF** (.pdf) - Adobe PDF documents
- **Word** (.docx) - Microsoft Word documents  
- **Text** (.txt) - Plain text files

### File Limits
- **Maximum file size:** 10 MB
- **Maximum content length:** 50,000 characters (automatically truncated if larger)

## How to Use

### Method 1: Click to Upload
1. Click the **paperclip icon** (📎) in the chat input area
2. A file upload zone will appear
3. Click **"browse"** and select your file
4. Wait for the file to be processed
5. Once processed, you'll see a green confirmation with the filename
6. The input will automatically populate with "Tell me about this document: [filename]"
7. You can edit this question to ask anything about the document
8. Click **Send** to get AI analysis of your document

### Method 2: Drag and Drop
1. Click the **paperclip icon** (📎) to open the upload zone
2. Drag your file from your file explorer
3. Drop it into the dashed border area
4. File will be processed automatically
5. Ask questions about the document

## What You Can Do

### Example Questions:
- "Summarize this document"
- "What are the main points discussed in this file?"
- "Extract all the names mentioned in this document"
- "What is the conclusion of this paper?"
- "Explain the technical terms used in this document"
- "Create bullet points from this content"
- "Compare this with [topic from knowledge base]"

### AI Analysis Features:
- **Summarization:** Get quick summaries of long documents
- **Question Answering:** Ask specific questions about content
- **Data Extraction:** Extract names, dates, numbers, key facts
- **Explanation:** Get complex content explained in simple terms
- **Comparison:** Compare uploaded content with IIT KGP knowledge base

## How It Works (Technical)

### Backend Processing
1. File is uploaded to `/api/upload-file` endpoint
2. Backend extracts text content based on file type:
   - **PDF:** Uses `pdf-parse` library
   - **DOCX:** Uses `mammoth` library
   - **TXT:** Direct text reading
3. Extracted text is validated and truncated if needed
4. Content is returned to frontend

### AI Query Enhancement
When you submit a query with an uploaded file:
1. The file content is prepended to your question
2. Web search is **disabled** (focuses on document content)
3. The query is sent to the AI: `"Here is the content of the document "{filename}":\n\n{content}\n\nUser's question: {your question}"`
4. AI analyzes the document and answers your question

### Context Management
- File content is passed as context for a **single query**
- If you want to ask multiple questions about the same document, you need to **upload it again** for each query
- This prevents token limit issues with very long documents

## Troubleshooting

### "Failed to parse PDF file"
- **Cause:** PDF is corrupted, password-protected, or image-only
- **Solution:** Try converting to plain text or removing password protection

### "Failed to parse Word document"
- **Cause:** File is corrupted or in unsupported format (.doc instead of .docx)
- **Solution:** Save as .docx or convert to PDF/TXT

### "File size exceeds 10MB limit"
- **Cause:** File is too large
- **Solution:** 
  - Split the document into smaller parts
  - Convert to plain text to reduce size
  - Use PDF compression tools

### "No text content could be extracted"
- **Cause:** File is image-only (scanned PDF) or empty
- **Solution:** 
  - Use OCR software to extract text first
  - Ensure file actually contains text content

### Upload button not responding
- **Cause:** Previous upload still processing
- **Solution:** Wait for the previous file to finish processing

## Privacy & Security

- ✅ Files are processed **in-memory** (not stored on server)
- ✅ Content is sent to Google Gemini AI for analysis
- ✅ File content is **not saved** to the knowledge base
- ✅ Each query is independent (no persistent file storage)

## Future Enhancements

Planned features for future versions:
- 🔄 Multiple file upload support
- 🖼️ Image OCR for scanned documents
- 💾 Session-based file memory (ask multiple questions without re-uploading)
- 📊 Excel and CSV file support
- 🔗 Direct URL document fetching
- 📝 Document comparison (upload 2+ files and compare)

## API Documentation

### Endpoint: `/api/upload-file`

**Method:** `POST`

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**Success Response (200):**
```json
{
  "success": true,
  "fileName": "example.pdf",
  "fileSize": 123456,
  "contentLength": 5000,
  "content": "Extracted text content...",
  "message": "File processed successfully..."
}
```

**Error Responses:**
- `400` - Invalid file, too large, or unsupported format
- `500` - Server processing error

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your file format is supported
3. Try a smaller or simpler document first
4. Check that Docker and all services are running

---

**Enjoy analyzing your documents with KGPGPT! 🚀📄**


