import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
