import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xgchwmkktznrtjsochvh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY2h3bWtrdHpucnRqc29jaHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NDE3MDgsImV4cCI6MjEwMzIxNzcwOH0.LIdn7bv9sUSUBQJwjzeC6T7JWGDDAmrLkfh3l0rVV3Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConfirmLock() {
  console.log('Testing confirm_package_lock for package aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa as Admin_2...');
  const { data, error } = await supabase.rpc('confirm_package_lock', {
    p_package_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    p_session_id: 'EV-2026-ADMIN2-TEST',
    p_user_id: '44444444-4444-4444-4444-444444444444',
  });

  if (error) {
    console.error('Confirm error:', error.message);
  } else {
    console.log('✅ Dual Confirmation SUCCESS! Package Hash:', data.package_hash);
  }
}

testConfirmLock();
