import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jdfakcnnvebihrjajmui.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZmFrY25udmViaWhyamFqbXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjY1ODIsImV4cCI6MjA3MjEwMjU4Mn0.qrADcvl5uWBafQ8NNkEiT_CDrnT8hXDrmzK02YzEPY8'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZmFrY25udmViaWhyamFqbXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUyNjU4MiwiZXhwIjoyMDcyMTAyNTgyfQ.ZaUEsyTKFOM39WfhZaxACYQ2lo7AJW4ZqPoXt-dpboY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
