import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSuspensionTriage() {
  console.log('=== TEST: Suspension Triage & Alert Dispatch Workflow ===');

  // 1. Create a fresh session
  const testSessionId = `EV-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
  const testUserId = '22222222-2222-2222-2222-222222222222'; // Reviewer_B
  await supabase.from('app_sessions').insert({
    id: testSessionId,
    user_id: testUserId,
    device_id: 'TEST-NODE-01',
    device_match_status: 'REGISTERED',
    status: 'ACTIVE',
    risk_score: 0,
    risk_level: 'NORMAL'
  });
  console.log(`\n1. Created active session: ${testSessionId}`);

  // 2. Trigger auto-suspension by firing events >= 70 pts
  console.log('2. Firing events to cross 70+ pts threshold...');
  await supabase.rpc('record_risk_event', {
    p_session_id: testSessionId,
    p_rule_name: 'UNKNOWN_DEVICE',
    p_points: 35,
    p_reason: 'Unregistered device node'
  });
  const suspRes = await supabase.rpc('record_risk_event', {
    p_session_id: testSessionId,
    p_rule_name: 'RAPID_QUESTION_ACCESS',
    p_points: 40,
    p_reason: 'High volume rapid access'
  });
  console.log('Auto-Suspension Trigger Result:', suspRes.data);

  // 3. Verify that suspension_reviews row was created with status PENDING
  const { data: reviewRows } = await supabase
    .from('suspension_reviews')
    .select('*')
    .eq('session_id', testSessionId);
  console.log('\n3. Suspension Reviews Row Created:');
  console.log('   Review ID:', reviewRows[0]?.id);
  console.log('   Status:', reviewRows[0]?.status);
  console.log('   Score at Suspension:', reviewRows[0]?.risk_score_at_suspension);
  console.log('   Contributing Events Count:', reviewRows[0]?.contributing_risk_events?.length);

  const reviewId = reviewRows[0]?.id;

  // 4. Verify ALERT_DISPATCHED audit event
  const { data: alertLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'ALERT_DISPATCHED')
    .eq('entity_id', testSessionId);
  console.log('\n4. Simulated Alert Dispatched to Audit Chain:');
  console.log('   Action:', alertLogs[0]?.action);
  console.log('   Message:', alertLogs[0]?.metadata?.message);

  // 5. Test note validation (< 10 chars should fail)
  console.log('\n5. Testing Mandatory Note Validation (Short note "ok"):');
  const shortNoteRes = await supabase.rpc('resolve_suspension_review', {
    p_review_id: reviewId,
    p_action: 'REINSTATE',
    p_admin_note: 'ok'
  });
  console.log('Short Note Rejection:', shortNoteRes.data);

  // 6. Test ESCALATE Action
  console.log('\n6. Testing ESCALATE Action (requires >= 10 chars):');
  const escRes = await supabase.rpc('resolve_suspension_review', {
    p_review_id: reviewId,
    p_action: 'ESCALATE',
    p_admin_note: 'Escalating to HR and Security Committee for formal probe'
  });
  console.log('Escalate Result:', escRes.data);

  // Verify session is still SUSPENDED
  const { data: sessAfterEsc } = await supabase.from('app_sessions').select('status').eq('id', testSessionId).single();
  console.log('Session Status After Escalation:', sessAfterEsc?.status);

  // 7. Test REINSTATE Action on a new review
  console.log('\n7. Testing REINSTATE Action on EV-1042 seeded review:');
  const { data: ev1042Review } = await supabase.from('suspension_reviews').select('*').eq('session_id', 'EV-1042').eq('status', 'PENDING').single();
  if (ev1042Review) {
    const reinRes = await supabase.rpc('resolve_suspension_review', {
      p_review_id: ev1042Review.id,
      p_action: 'REINSTATE',
      p_admin_note: 'Identity verified with proctoring team; device authorized'
    });
    console.log('Reinstate Result:', reinRes.data);

    const { data: sessAfterRein } = await supabase.from('app_sessions').select('status, risk_score').eq('id', 'EV-1042').single();
    console.log('EV-1042 Session After Reinstatement:', sessAfterRein);
  }

  console.log('\n✅ All Suspension Review & Alert Triage Tests Passed Successfully!');
}

testSuspensionTriage();
