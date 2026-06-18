import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdmin() {
  const email = 'devansh@gmail.com';
  const password = 'Devansh@2006';
  
  console.log(`[1] Signing in as ${email}...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('[FAIL] Sign in failed:', signInError.message);
    return;
  }
  
  const userId = signInData.user.id;
  console.log('[PASS] Signed in. User ID:', userId);

  console.log('[2] Elevating role to ADMIN...');
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .update({ role: 'ADMIN' })
    .eq('id', userId)
    .select();

  if (profileErr) {
    console.error('[FAIL] Elevation failed:', profileErr.message);
    return;
  }
  console.log('[PASS] Elevation query result:', profileData);

  console.log('[3] Trying to SELECT properties...');
  const { data: props, error: selectErr } = await supabase
    .from('properties')
    .select('id, title, landlord_id, image_urls');

  if (selectErr) {
    console.error('[FAIL] Select failed:', selectErr.message);
  } else {
    console.log('[PASS] Select success. Found properties count:', props.length);
    console.log('Penthouse details from select:', props.find(p => p.id === 'b1c2b50e-480b-4781-a00b-11616d535c8d'));
  }

  console.log('[4] Trying to UPDATE penthouse property...');
  const { data: updateData, error: updateErr } = await supabase
    .from('properties')
    .update({
      image_urls: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
      ]
    })
    .eq('id', 'b1c2b50e-480b-4781-a00b-11616d535c8d')
    .select();

  if (updateErr) {
    console.error('[FAIL] Update failed:', updateErr.message);
  } else {
    console.log('[PASS] Update query result:', updateData);
  }

  console.log('[5] Restoring role to TENANT...');
  const { data: revertData, error: revertErr } = await supabase
    .from('profiles')
    .update({ role: 'TENANT' })
    .eq('id', userId)
    .select();

  if (revertErr) {
    console.error('[FAIL] Reversion failed:', revertErr.message);
  } else {
    console.log('[PASS] Reversion query result:', revertData);
  }
}

testAdmin().catch(console.error);
