import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
      console.error('❌ Supabase connection failed:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Supabase connection failed',
        error: error.message 
      }, { status: 500 });
    }
    
    console.log('✅ Supabase connection successful');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase is connected and working',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Supabase test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
