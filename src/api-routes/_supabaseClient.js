import { createClient } from '@supabase/supabase-js';

// Get env variables - Vercel will inject these
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[SUPABASE] Missing environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_KEY,
  });
}

// Create and export Supabase client
const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

export default supabase;
