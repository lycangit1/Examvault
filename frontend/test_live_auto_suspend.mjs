import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNaturalAutoSuspend() {
  console.log('1. Logging in as Reviewer_B with UNKNOWN device context...');
  const loginRes = await supabase.rpc('authenticate_user', {
    p_email: 'reviewer_b@examvault.com',
    p_password: 'password123',
    p_device_mode: 'UNKNOWN'
  });

  const otp = loginRes.data.demo_otp;
  const userId = loginRes.data.user.id;

  const verifyRes = await supabase.rpc('verify_demo_otp', {
    p_user_id: userId,
    p_otp: otp,
    p_device_mode: 'UNKNOWN'
  });

  const sessionId = verifyRes.data.session_id;
  console.log(`Created Session ${sessionId} with UNKNOWN device (+35 pts).`);

  // Check initial score
  const { data: initialSession } = await supabase.from('app_sessions').select('*').eq('id', sessionId).single();
  console.log(`Initial Session Risk Score: ${initialSession.risk_score}/100, Status: ${initialSession.status}`);

  console.log('\n2. Rapidly viewing 4 questions in under 2 minutes...');
  const qList = ['Q-108', 'Q-103', 'Q-112', 'Q-395'];
  for (const qId of qList) {
    const res = await supabase.rpc('record_question_view', {
      p_question_id: qId,
      p_session_id: sessionId,
      p_user_id: userId
    });
    console.log(`Viewed ${qId}:`, res.data);
  }

  // Check final score & suspension state
  const { data: finalSession } = await supabase.from('app_sessions').select('*').eq('id', sessionId).single();
  console.log(`\n3. Final Session State for ${sessionId}:`);
  console.log(`   Score: ${finalSession.risk_score} / 100`);
  console.log(`   Level: ${finalSession.risk_level}`);
  console.log(`   Status: ${finalSession.status}`);

  if (finalSession.status === 'SUSPENDED') {
    console.log('✅ PASS: Session was AUTOMATICALLY SUSPENDED in real-time!');
  } else {
    console.log('❌ FAIL: Session not suspended yet');
  }
}

testNaturalAutoSuspend();
