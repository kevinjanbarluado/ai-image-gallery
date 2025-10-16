import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Client for authenticated requests (uses user's JWT)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to verify user authentication
export async function verifyAuth(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user.id;
}

