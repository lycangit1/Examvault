import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLockdownAuth() {
  console.log('1. Setting System Lockdown State to LOCKED...');
  await supabase.from('system_lockdown_state').update({ is_locked: true, lockdown_reason: 'Test Security Breach' }).eq('id', 1);

  console.log('\n2. Testing Login as Setter_A during lockdown (Expect ACCESS DENIED):');
  const setterRes = await supabase.rpc('authenticate_user', {
    p_email: 'setter_a@examvault.com',
    p_password: 'password123',
    p_device_mode: 'REGISTERED'
  });
  console.log('Setter Response:', setterRes.data);

  console.log('\n3. Testing Login as Investigator during lockdown (Expect ALLOWED):');
  const invRes = await supabase.rpc('authenticate_user', {
    p_email: 'investigator@examvault.com',
    p_password: 'password123',
    p_device_mode: 'REGISTERED'
  });
  console.log('Investigator Response:', invRes.data);

  if (invRes.data?.success && invRes.data?.demo_otp) {
    console.log(`\n4. Testing OTP Verification with code: ${invRes.data.demo_otp}...`);
    const otpRes = await supabase.rpc('verify_demo_otp', {
      p_user_id: invRes.data.user.id,
      p_otp: invRes.data.demo_otp,
      p_device_mode: 'REGISTERED'
    });
    console.log('OTP Verification Result:', otpRes.data);
  }

  console.log('\n5. Lifting Lockdown...');
  await supabase.rpc('lift_system_lockdown', { p_justification: 'Auth test passed successfully' });
  console.log('✅ System Lockdown Lifted!');
}

testLockdownAuth();
