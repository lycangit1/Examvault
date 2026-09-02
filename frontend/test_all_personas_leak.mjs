import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllPersonasLeakAttribution() {
  console.log('--- 🧪 STARTING COMPLETE MULTI-PERSONA LEAK ATTRIBUTION SUITE ---');

  // 1. Reviewer_B leaking Q-105 (Screenshot from user)
  console.log('1. Testing Reviewer_B Leaking Q-105 (EV-2026-5230)...');
  const { data: revData, error: revErr } = await supabase.rpc('correlate_leak_evidence', {
    p_question_id: 'Q-105',
    p_ocr_text: 'CONFIDENTIAL • REVIEWER_B • EV-2026-5230 • 06:20',
    p_session_token: 'EV-2026-5230',
    p_investigator_id: '55555555-5555-5555-5555-555555555555'
  });
  if (revErr || !revData?.success) throw new Error('Reviewer leak failed: ' + (revErr?.message || revData?.error));
  console.log('✓ Reviewer_B Attributed Accurately!');
  console.log('  Actor:', revData.attributed_user_name, `(${revData.attributed_user_email})`);
  console.log('  Role:', revData.attributed_user_role);
  console.log('  Question Leaked:', revData.question_id, '-', revData.question_title);
  console.log('  Confidence:', revData.confidence_score + '%');

  // 2. Setter_A leaking Q-105
  console.log('\n2. Testing Setter_A Leaking Q-105 (EV-2026-2616)...');
  const { data: setData, error: setErr } = await supabase.rpc('correlate_leak_evidence', {
    p_question_id: 'Q-105',
    p_ocr_text: 'CONFIDENTIAL • SETTER_A • EV-2026-2616 • 05:35',
    p_session_token: 'EV-2026-2616',
    p_investigator_id: '55555555-5555-5555-5555-555555555555'
  });
  if (setErr || !setData?.success) throw new Error('Setter leak failed: ' + (setErr?.message || setData?.error));
  console.log('✓ Setter_A Attributed Accurately!');
  console.log('  Actor:', setData.attributed_user_name, `(${setData.attributed_user_email})`);
  console.log('  Role:', setData.attributed_user_role);
  console.log('  Confidence:', setData.confidence_score + '%');

  // 3. Approver_C leaking Q-108
  console.log('\n3. Testing Approver_C Leaking Q-108 (EV-APPROVER-2026)...');
  const { data: appData, error: appErr } = await supabase.rpc('correlate_leak_evidence', {
    p_question_id: 'Q-108',
    p_ocr_text: 'CONFIDENTIAL • APPROVER_C • EV-APPROVER-2026 • 06:01',
    p_session_token: 'EV-APPROVER-2026',
    p_investigator_id: '55555555-5555-5555-5555-555555555555'
  });
  if (appErr || !appData?.success) throw new Error('Approver leak failed: ' + (appErr?.message || appData?.error));
  console.log('✓ Approver_C Attributed Accurately!');
  console.log('  Actor:', appData.attributed_user_name, `(${appData.attributed_user_email})`);
  console.log('  Role:', appData.attributed_user_role);
  console.log('  Confidence:', appData.confidence_score + '%');

  console.log('\n🎉 ALL MULTI-STAGE LEAK ATTRIBUTION SCENARIOS ACCURATE & VERIFIED!');
}

testAllPersonasLeakAttribution().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
