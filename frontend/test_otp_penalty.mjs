import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOtpPenaltyAutoSuspend() {
  console.log('1. Initiating login from UNKNOWN device (+35 pts)...');
  const loginRes = await supabase.rpc('authenticate_user', {
    p_email: 'reviewer_b@examvault.com',
    p_password: 'password123',
    p_device_mode: 'UNKNOWN'
  });

  const userId = loginRes.data.user.id;
  const correctOtp = loginRes.data.demo_otp;

  console.log('2. Entering WRONG OTP once (penalty trigger)...');
  await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: '000000',
    p_device_mode: 'UNKNOWN'
  });

  console.log('3. Entering CORRECT OTP on retry 2 (+15 pts OTP penalty)...');
  const otpRes = await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: correctOtp,
    p_device_mode: 'UNKNOWN'
  });

  const sessionId = otpRes.data.session_id;
  console.log(`Created Session: ${sessionId}`);

  // Check score after login
  let { data: sess } = await supabase.from('app_sessions').select('*').eq('id', sessionId).single();
  console.log(`Current Score after OTP Retry: ${sess.risk_score} / 100 (${sess.risk_level})`);

  console.log('\n4. Recording Face Verification FAILURE (+35 pts)...');
  await supabase.rpc('record_face_verification', {
    p_session_id: sessionId,
    p_face_verified: false
  });

  // Check final score & suspension
  const { data: finalSess } = await supabase.from('app_sessions').select('*').eq('id', sessionId).single();
  console.log(`\n5. Final Session State for ${sessionId}:`);
  console.log(`   Score: ${finalSess.risk_score} / 100 (35 Device + 15 OTP Penalty + 35 Face Failure)`);
  console.log(`   Level: ${finalSess.risk_level}`);
  console.log(`   Status: ${finalSess.status}`);

  if (finalSess.status === 'SUSPENDED') {
    console.log('✅ PASS: Session successfully AUTO-SUSPENDED on multi-factor failure!');
  }
}

testOtpPenaltyAutoSuspend();
