import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPackageAssemblyFlow() {
  console.log('--- 🧪 TESTING APPROVER ASSEMBLY & DUAL LOCK FLOW ---');

  // 1. Approver assembles package
  const pkgCode = `PHY-2026-SET-${Math.floor(100 + Math.random() * 900)}`;
  console.log(`1. Assembling new package "${pkgCode}" with Lock #1...`);
  const { data: asmData, error: asmErr } = await supabase.rpc('assemble_exam_package', {
    p_package_name: pkgCode,
    p_exam_name: 'Physics National Exam 2026',
    p_question_ids: ['Q-108', 'Q-103'],
    p_approver_1_id: '33333333-3333-3333-3333-333333333333',
    p_session_id: 'EV-3333'
  });
  if (asmErr || !asmData?.success) throw new Error('Assembly failed: ' + (asmErr?.message || asmData?.error));
  console.log('✓ Package Lock #1 Initiated:', asmData);

  // 2. Admin_2 signs and locks (Lock #2)
  console.log(`2. Admin_2 signing Dual-Confirmation (Lock #2) on package ${asmData.package_id}...`);
  const { data: lockData, error: lockErr } = await supabase.rpc('confirm_package_lock', {
    p_package_id: asmData.package_id,
    p_session_id: 'EV-4444',
    p_user_id: '44444444-4444-4444-4444-444444444444'
  });
  if (lockErr || !lockData?.success) throw new Error('Dual confirmation failed: ' + (lockErr?.message || lockData?.error));
  console.log('✓ Dual Lock #2 Confirmed! Manifest Hash:', lockData.manifest_hash);

  console.log('\n🎉 APPROVER ASSEMBLY & DUAL CONFIRMATION VERIFIED 100% OPERATIONAL!');
}

testPackageAssemblyFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
