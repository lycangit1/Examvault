import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAliases() {
  console.log('1. Testing authenticate_user for setter_a@examvault.demo...');
  const r1 = await supabase.rpc('authenticate_user', {
    p_email: 'setter_a@examvault.demo',
    p_password: 'password123',
    p_device_mode: 'REGISTERED'
  });
  console.log('Setter .demo Result:', r1.data);

  console.log('\n2. Testing authenticate_user for investigator@examvault.demo...');
  const r2 = await supabase.rpc('authenticate_user', {
    p_email: 'investigator@examvault.demo',
    p_password: 'password123',
    p_device_mode: 'REGISTERED'
  });
  console.log('Investigator .demo Result:', r2.data);
}

testAliases();
