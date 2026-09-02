import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuestions() {
  console.log('1. Fetching questions for Setter_A...');
  const { data: qData, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (qErr) {
    console.error('Fetch error:', qErr.message);
  } else {
    console.log(`✅ Success! Found ${qData?.length} questions:`, qData?.map(q => `${q.id} (${q.status})`).join(', '));
  }

  const testId = `Q-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`2. Testing draft insert for ${testId}...`);
  const testQ = {
    id: testId,
    title: 'Kinematics - Test Acceleration',
    subject: 'Physics',
    question_text: 'Unit of force in SI units',
    options: [
      { id: 'option_1', text: 'Newton' },
      { id: 'option_2', text: 'Joule' },
      { id: 'option_3', text: 'Watt' },
      { id: 'option_4', text: 'Pascal' },
    ],
    correct_answer: 'option_1',
    status: 'DRAFT',
    current_version: 1,
    created_by: '11111111-1111-1111-1111-111111111111',
    assigned_reviewer_id: '22222222-2222-2222-2222-222222222222',
  };

  const { data: insData, error: insErr } = await supabase
    .from('questions')
    .insert(testQ)
    .select();

  if (insErr) {
    console.error('Insert error:', insErr.message);
  } else {
    console.log(`✅ Question inserted successfully! ID:`, insData?.[0]?.id);
  }
}

testQuestions();
