import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const accounts = [
  { email: 'admin2@examvault.com', pass: 'password123' },
  { email: 'setter_a@examvault.com', pass: 'password123' },
];

async function testRpc() {
  for (const acc of accounts) {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_email: acc.email,
      p_password: acc.pass,
      p_device_mode: 'REGISTERED',
    });
    console.log(`Auth result for ${acc.email}:`, { data, error });
  }
}

testRpc();
