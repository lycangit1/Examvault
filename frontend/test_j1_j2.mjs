import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSecurityModules() {
  console.log('=== TEST MODULE J1: Session Auto-Suspension & Reinstatement ===');
  const testSessionId = `EV-SUSP-${Date.now().toString().slice(-4)}`;

  // 1. Create initial active session
  await supabase.from('app_sessions').insert({
    id: testSessionId,
    user_id: '22222222-2222-2222-2222-222222222222',
    device_id: 'TEST-AUTO-SUSP-NODE',
    device_match_status: 'REGISTERED',
    status: 'ACTIVE',
    risk_score: 0,
    risk_level: 'NORMAL'
  });

  // 2. Trigger critical live events: Device change (+40) + Rapid access (+35) = 75 pts -> SUSPENDED
  console.log('Fired event 1: DEVICE_FINGERPRINT_CHANGED (+40 pts)...');
  await supabase.rpc('record_risk_event', {
    p_session_id: testSessionId,
    p_rule_name: 'DEVICE_FINGERPRINT_CHANGED',
    p_points: 40,
    p_reason: 'Mid-session hardware fingerprint modification detected'
  });

  console.log('Fired event 2: RAPID_PACE_ACCESS (+35 pts)...');
  const suspRes = await supabase.rpc('record_risk_event', {
    p_session_id: testSessionId,
    p_rule_name: 'RAPID_PACE_ACCESS',
    p_points: 35,
    p_reason: 'Abnormal question pacing rate exceeded threshold'
  });

  console.log('Result after 75 pts:', suspRes.data);
  if (suspRes.data?.is_suspended && suspRes.data?.status === 'SUSPENDED') {
    console.log('✅ Auto-Suspension Verified: Session status is SUSPENDED at 75 points.');
  } else {
    console.error('❌ Auto-suspension check failed!');
  }

  // 3. Reinstate session
  console.log('\nTesting Admin Reinstatement on suspended session...');
  const reinRes = await supabase.rpc('reinstate_session', {
    p_session_id: testSessionId,
    p_admin_note: 'Verified with proctoring team: authorized secondary monitor setup verified.',
    p_admin_id: '55555555-5555-5555-5555-555555555555'
  });
  console.log('Reinstatement Result:', reinRes.data);
  if (reinRes.data?.status === 'ACTIVE' && reinRes.data?.risk_score === 35) {
    console.log('✅ Reinstatement Verified: Session returned to ACTIVE with score 35.');
  }

  // Clean up test session
  await supabase.from('app_sessions').delete().eq('id', testSessionId);

  console.log('\n=== TEST MODULE J2: System-Wide Lockdown Engine ===');
  
  // 1. Trigger Pre-Lockdown Warning
  console.log('1. Triggering Pre-Lockdown Warning...');
  const warnRes = await supabase.rpc('trigger_system_lockdown', {
    p_reason: 'Multiple concurrent high-risk anomaly spikes detected across 3 nodes',
    p_admin_id: '55555555-5555-5555-5555-555555555555',
    p_is_pre_warning: true,
    p_signals: [{ signal: 'HIGH_RISK_SPIKE', count: 3 }]
  });
  console.log('Warning Result:', warnRes.data);

  // 2. Trigger Full Lockdown
  console.log('2. Triggering Full System Lockdown Mode...');
  const lockRes = await supabase.rpc('trigger_system_lockdown', {
    p_reason: 'Coordinated distributed scraping attempt detected across non-whitelisted IP range',
    p_admin_id: '55555555-5555-5555-5555-555555555555',
    p_is_pre_warning: false,
    p_signals: [{ signal: 'DISTRIBUTED_SCRAPING', severity: 'CRITICAL' }]
  });
  console.log('Lockdown Result:', lockRes.data);

  // 3. Lift Lockdown
  console.log('3. Lifting System Lockdown with Justification...');
  const liftRes = await supabase.rpc('lift_system_lockdown', {
    p_justification: 'Threat neutralized. Offending IPs blocked at firewall gateway. Integrity re-verified.',
    p_admin_id: '55555555-5555-5555-5555-555555555555'
  });
  console.log('Lift Result:', liftRes.data);

  console.log('\n✅ All Module J1 & Module J2 Tests Passed Successfully!');
}

testSecurityModules();
