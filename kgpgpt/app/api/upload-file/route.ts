import { NextRequest, NextResponse } from 'next/server';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

/**
 * API Route: /api/upload-file
 * 
 * Handles file uploads and extracts text content from:
 * - PDF files (.pdf)
 * - Word documents (.docx)
 * - Text files (.txt)
 * - Images (future: OCR support)
 * 
 * Returns extracted text that can be used as context for queries
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    let extractedText = '';

    console.log(`Processing file: ${file.name} (${fileType}, ${(file.size / 1024).toFixed(2)} KB)`);

    // Process based on file type
    if (fileName.endsWith('.pdf')) {
      // Handle PDF files
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        // pdfParse is an imported module with a default export function.
        const pdfData = await (pdfParse as any).default(buffer);
        extractedText = pdfData.text;
        console.log(`Extracted ${extractedText.length} characters from PDF`);
      } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
          { error: 'Failed to parse PDF file. The file may be corrupted or password-protected.' },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith('.docx')) {
      // Handle Word documents
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        console.log(`Extracted ${extractedText.length} characters from DOCX`);
      } catch (error) {
        console.error('DOCX parsing error:', error);
        return NextResponse.json(
          { error: 'Failed to parse Word document. The file may be corrupted.' },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
      // Handle text files
      extractedText = await file.text();
      console.log(`Read ${extractedText.length} characters from text file`);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' },
        { status: 400 }
      );
    }

    // Validate extracted content
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content could be extracted from the file' },
        { status: 400 }
      );
    }

    // Limit content length (max 50,000 characters to avoid token limits)
    const maxLength = 50000;
    if (extractedText.length > maxLength) {
      console.log(`Truncating content from ${extractedText.length} to ${maxLength} characters`);
      extractedText = extractedText.substring(0, maxLength) + '\n\n[... Content truncated due to length ...]';
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      contentLength: extractedText.length,
      content: extractedText,
      message: 'File processed successfully. You can now ask questions about this document.'
    });

  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Also support GET to check if endpoint is working
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'File upload endpoint is ready',
    supportedFormats: ['PDF (.pdf)', 'Word (.docx)', 'Text (.txt)'],
    maxFileSize: '10MB'
  });
}


