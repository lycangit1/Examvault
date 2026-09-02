import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const accounts = [
  { email: 'setter_a@examvault.com', pass: 'password123' },
  { email: 'reviewer_b@examvault.com', pass: 'password123' },
  { email: 'approver_c@examvault.com', pass: 'password123' },
  { email: 'admin2@examvault.com', pass: 'password123' },
  { email: 'investigator@examvault.com', pass: 'password123' },
];

async function testAllLogins() {
  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });

    if (error) {
      console.log(`❌ Login FAILED for ${acc.email}: ${error.message}`);
    } else {
      console.log(`✅ Login SUCCESS for ${acc.email} (ID: ${data.user?.id})`);
    }
  }
}

testAllLogins();
