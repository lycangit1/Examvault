import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReviewDecision() {
  console.log('Testing submit_review_decision on Q-103 (UNDER_REVIEW)...');
  const { data, error } = await supabase.rpc('submit_review_decision', {
    p_question_id: 'Q-103',
    p_decision: 'APPROVED',
    p_comment: 'MCQ options and physics formulation verified sound.',
    p_session_id: 'EV-2026-TEST',
    p_user_id: '22222222-2222-2222-2222-222222222222',
  });

  if (error) {
    console.error('RPC Error:', error.message);
  } else {
    console.log('✅ Review Decision SUCCESS:', data);
  }
}

testReviewDecision();
