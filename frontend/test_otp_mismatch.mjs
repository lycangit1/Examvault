import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOtp3Failures() {
  console.log('1. Initiating login for Reviewer_B to generate OTP challenge...');
  const initRes = await supabase.rpc('authenticate_user', {
    p_email: 'reviewer_b@examvault.com',
    p_password: 'password123',
    p_device_mode: 'REGISTERED'
  });

  const userId = initRes.data.user.id;
  const correctOtp = initRes.data.demo_otp;
  console.log(`User ID: ${userId}, Generated Correct OTP: ${correctOtp}`);

  console.log('\n2. Attempt 1: Entering WRONG OTP (000000)...');
  const att1 = await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: '000000',
    p_device_mode: 'REGISTERED'
  });
  console.log('Attempt 1 Result:', att1.data);

  console.log('\n3. Attempt 2: Entering WRONG OTP (111111)...');
  const att2 = await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: '111111',
    p_device_mode: 'REGISTERED'
  });
  console.log('Attempt 2 Result:', att2.data);

  console.log('\n4. Attempt 3: Entering WRONG OTP (222222) - Should reach 3/3 lock limit...');
  const att3 = await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: '222222',
    p_device_mode: 'REGISTERED'
  });
  console.log('Attempt 3 Result:', att3.data);

  console.log('\n5. Attempt 4: Entering the CORRECT OTP now (should be REJECTED because challenge is invalidated):');
  const att4 = await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: correctOtp,
    p_device_mode: 'REGISTERED'
  });
  console.log('Attempt 4 Result:', att4.data);

  // Check audit logs for LOGIN_FAILED event
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(2);
  console.log('\n6. Audit Log Recorded for Failure:', logs[0]?.action, logs[0]?.metadata);
}

testOtp3Failures();
