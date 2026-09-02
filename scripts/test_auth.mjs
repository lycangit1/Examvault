import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'setter_a@examvault.demo',
    password: 'password123',
  });

  if (error) {
    console.error('Login Failed:', error.message);
    
    // Try signing up the user via client
    console.log('Attempting signup via client...');
    const { data: signData, error: signErr } = await supabase.auth.signUp({
      email: 'setter_a@examvault.demo',
      password: 'password123',
    });
    if (signErr) {
      console.error('SignUp Failed:', signErr.message);
    } else {
      console.log('SignUp Succeeded:', signData.user?.id);
    }
  } else {
    console.log('Login Succeeded for:', data.user?.email, 'ID:', data.user?.id);
  }
}

testLogin();
