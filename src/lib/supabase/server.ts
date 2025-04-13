import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Check if Supabase credentials are properly set
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not properly configured. Some features may not work.');
  }

  // Create a dummy client with no cookies for server-side rendering
  // This avoids the cookies() synchronous API issue
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return undefined; // Don't try to access cookies on server
        },
        set(name, value, options) {
          // No-op for server
        },
        remove(name, options) {
          // No-op for server
        },
      },
    }
  );
}
