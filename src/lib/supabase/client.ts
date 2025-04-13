import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not properly configured. Some features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
