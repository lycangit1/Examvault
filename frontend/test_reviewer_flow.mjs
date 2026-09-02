import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReviewerFlow() {
  console.log('--- 🧪 TESTING REVIEWER DECISION WORKFLOW ---');

  // 1. Submit review decision on Q-812
  console.log('1. Submitting review decision on item "Q-812"...');
  const { data, error } = await supabase.rpc('submit_review_decision', {
    p_question_id: 'Q-812',
    p_session_id: 'EV-2026-1590',
    p_user_id: '22222222-2222-2222-2222-222222222222',
    p_reviewer_id: '22222222-2222-2222-2222-222222222222',
    p_decision: 'APPROVED',
    p_comment: 'Approved: Scientific accuracy and canonical answer verified.'
  });

  if (error || !data?.success) {
    throw new Error('Review decision failed: ' + (error?.message || data?.error));
  }

  console.log('✓ Review Decision Success! New Status:', data.status);
  console.log('\n🎉 REVIEWER DECISION WORKFLOW VERIFIED 100% OPERATIONAL!');
}

testReviewerFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
