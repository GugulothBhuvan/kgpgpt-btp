'use client'

import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jdfakcnnvebihrjajmui.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZmFrY25udmViaWhyamFqbXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjY1ODIsImV4cCI6MjA3MjEwMjU4Mn0.qrADcvl5uWBafQ8NNkEiT_CDrnT8hXDrmzK02YzEPY8'

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)