import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeakReport() {
  console.log('Testing create_leak_report for session EV-1042 and question Q-101...');
  const { data, error } = await supabase.rpc('create_leak_report', {
    p_storage_path: 'demo-assets/leaked_question_q101.png',
    p_detected_watermark: 'CONFIDENTIAL • Reviewer_B • EV-1042 • 02:14',
    p_entered_session_token: 'EV-1042',
    p_question_id: 'Q-101',
    p_user_id: '55555555-5555-5555-5555-555555555555',
  });

  if (error) {
    console.error('Leak report error:', error.message);
  } else {
    console.log('✅ Leak Report Created Successfully:', data);
  }
}

testLeakReport();
