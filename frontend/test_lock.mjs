import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLock() {
  console.log('Testing initiate_package_lock on existing package PHY-2026-SET-A...');
  const { data, error } = await supabase.rpc('initiate_package_lock', {
    p_exam_name: 'Physics Mock Examination',
    p_package_name: 'PHY-2026-SET-A',
    p_question_ids: ['Q-108', 'Q-103', 'Q-112', 'Q-395'],
    p_session_id: 'EV-2026-LOCK-TEST',
    p_user_id: '33333333-3333-3333-3333-333333333333',
  });

  if (error) {
    console.error('Lock error:', error.message);
  } else {
    console.log('✅ Package Lock SUCCESS on PHY-2026-SET-A:', data);
  }
}

testLock();
