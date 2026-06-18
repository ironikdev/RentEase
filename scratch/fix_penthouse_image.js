import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixImage() {
  const email = `temp_admin_${Date.now()}@rentease.com`;
  const password = 'Devansh@2006';

  console.log(`[1] Signing up new admin user: ${email}...`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Temporary Admin',
        role: 'ADMIN'
      }
    }
  });

  if (signUpErr) {
    console.error('[FAIL] Sign up failed:', signUpErr.message);
    return;
  }

  console.log('[PASS] Signed up admin user ID:', signUpData.user.id);

  console.log('[2] Signing in as the new admin user...');
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInErr) {
    console.error('[FAIL] Sign in failed:', signInErr.message);
    return;
  }

  console.log('[PASS] Signed in.');

  // Verify role is indeed ADMIN
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .single();

  if (profileErr) {
    console.error('[FAIL] Could not verify profile role:', profileErr.message);
    return;
  }

  console.log(`[INFO] Profile role: ${profile.role}`);

  if (profile.role !== 'ADMIN') {
    console.error('[FAIL] Role is not ADMIN!');
    return;
  }

  console.log('[3] Updating the Urban Chic Penthouse image_urls array...');
  const { data: updateData, error: updateErr } = await supabase
    .from('properties')
    .update({
      image_urls: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
      ]
    })
    .ilike('title', '%Urban Chic Penthouse%');

  if (updateErr) {
    console.error('[FAIL] Update failed:', updateErr.message);
    return;
  }

  console.log('[PASS] Update query completed.');

  console.log('[4] Verifying the new image URLs...');
  const { data: verifyData, error: verifyErr } = await supabase
    .from('properties')
    .select('id, title, image_urls')
    .ilike('title', '%Urban Chic Penthouse%');

  if (verifyErr) {
    console.error('[FAIL] Verification query failed:', verifyErr.message);
  } else {
    console.log('[PASS] Verification data:', verifyData);
  }
}

fixImage().catch(console.error);
