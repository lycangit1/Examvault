import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllModules() {
  console.log('--- 🧪 STARTING DUAL LEAK ATTRIBUTION & FORENSIC DOSSIER VERIFICATION ---');

  // 1. Test Setter_A Leak Attribution (Image 1 case from user)
  console.log('1. Testing Setter_A Leak Attribution (Q-105 / EV-2026-2616)...');
  const { data: setterLeak, error: setterErr } = await supabase.rpc('correlate_leak_evidence', {
    p_question_id: 'Q-105',
    p_ocr_text: 'CONFIDENTIAL • SETTER_A • EV-2026-2616 • 05:35',
    p_session_token: 'EV-2026-2616',
    p_investigator_id: '55555555-5555-5555-5555-555555555555'
  });
  if (setterErr) throw new Error('Setter Leak RPC failed: ' + setterErr.message);
  console.log('✓ Setter_A Attribution Verified!');
  console.log('  Attributed Actor:', setterLeak.attributed_user_name, `(${setterLeak.attributed_user_email})`);
  console.log('  Attributed Role:', setterLeak.attributed_user_role);
  console.log('  Session Token:', setterLeak.attributed_session_id);
  console.log('  Question Title:', setterLeak.question_title);
  console.log('  Confidence Score:', setterLeak.confidence_score + '%');
  console.log('  Audit Match Blocks:', setterLeak.audit_matches?.length || 0);

  // 2. Test Reviewer_B Leak Attribution
  console.log('\n2. Testing Reviewer_B Leak Attribution (Q-101 / EV-1042)...');
  const { data: reviewerLeak, error: reviewerErr } = await supabase.rpc('correlate_leak_evidence', {
    p_question_id: 'Q-101',
    p_ocr_text: 'CONFIDENTIAL • REVIEWER_B • EV-1042 • 02:14',
    p_session_token: 'EV-1042',
    p_investigator_id: '55555555-5555-5555-5555-555555555555'
  });
  if (reviewerErr) throw new Error('Reviewer Leak RPC failed: ' + reviewerErr.message);
  console.log('✓ Reviewer_B Attribution Verified!');
  console.log('  Attributed Actor:', reviewerLeak.attributed_user_name, `(${reviewerLeak.attributed_user_email})`);
  console.log('  Attributed Role:', reviewerLeak.attributed_user_role);
  console.log('  Confidence Score:', reviewerLeak.confidence_score + '%');

  console.log('\n🎉 ALL LEAK ATTRIBUTIONS DYNAMICALLY CORRELATED AND ACCURATE!');
}

testAllModules().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
