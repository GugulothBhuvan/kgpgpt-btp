import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    console.log('🧪 Testing Gemini API...');
    
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return NextResponse.json({ 
        error: 'API key missing', 
        message: 'GEMINI_API_KEY environment variable not set' 
      }, { status: 500 });
    }
    
    console.log('✅ API key found (length:', apiKey.length, ')');
    
    // Initialize Gemini
    console.log('🔧 Initializing Gemini client...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the correct model name for v1 API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Test 1: Simple text generation
    console.log('1️⃣ Testing simple text generation...');
    const result = await model.generateContent('Say "Hello, Gemini API is working!"');
    const response = result.response.text();
    
    console.log('✅ Simple generation successful:', response);
    
    // Test 2: Slightly more complex prompt
    console.log('2️⃣ Testing complex prompt...');
    const complexResult = await model.generateContent('What is 2+2? Answer in one word.');
    const complexResponse = complexResult.response.text();
    
    console.log('✅ Complex generation successful:', complexResponse);
    
    // Test 3: Check API response structure
    console.log('3️⃣ Checking response structure...');
    console.log('Response type:', typeof response);
    console.log('Response length:', response.length);
    
    console.log('🎉 All Gemini API tests passed!');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Gemini API is working correctly',
      tests: {
        simpleGeneration: response,
        complexGeneration: complexResponse,
        apiKeyLength: apiKey.length,
        responseType: typeof response
      }
    });
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    
    // Provide detailed error information
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = error.message;
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Gemini API test failed', 
      message: errorDetails,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
