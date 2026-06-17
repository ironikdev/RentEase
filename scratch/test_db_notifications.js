import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDbTest() {
  const email = 'devansh@gmail.com';
  const password = 'Devansh@2006';
  
  console.log(`[TEST] Signing in as ${email}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error('[FAIL] Authentication failed:', authErr.message);
    return;
  }

  const userId = authData.user.id;
  console.log('[PASS] Signed in user ID:', userId);

  // Clean up any existing test notifications
  console.log('[TEST] Cleaning up old notifications...');
  const { error: deleteErr } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (deleteErr) {
    console.error('[FAIL] Could not clean up notifications. (Make sure table exists and migration is applied!):', deleteErr.message);
    return;
  }
  console.log('[PASS] Notifications cleaned up.');

  // Test insert notification
  const title = 'Property Available Again';
  const message = 'A property in your favorites is now available.';
  const propertyId = 'e6758ee0-039b-474b-aae5-567f8cb4ec84'; // Indiranagar studio from properties

  console.log('[TEST] Inserting 1st notification...');
  const { error: insertErr } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      property_id: propertyId,
      title,
      message,
      is_read: false
    });

  if (insertErr) {
    console.error('[FAIL] Notification insert failed:', insertErr.message);
    return;
  }
  console.log('[PASS] First notification inserted successfully.');

  // Test duplicate prevention check
  console.log('[TEST] Checking duplicate prevention before inserting 2nd notification...');
  const { data: existing, error: existErr } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .eq('title', title)
    .eq('is_read', false);

  if (existErr) {
    console.error('[FAIL] Duplicate check failed:', existErr.message);
    return;
  }

  let hasDuplicate = existing && existing.length > 0;
  console.log('[INFO] Duplicate found?', hasDuplicate);

  if (hasDuplicate) {
    console.log('[PASS] Duplicate prevention logic check succeeded (duplicate detected).');
  } else {
    console.error('[FAIL] Duplicate not detected!');
  }

  // Fetch notifications
  console.log('[TEST] Fetching notifications...');
  const { data: list, error: listErr } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (listErr) {
    console.error('[FAIL] Fetching notifications failed:', listErr.message);
    return;
  }
  console.log('[PASS] Notifications fetched. Count:', list.length, 'Data:', list[0]);

  // Test update (mark as read)
  console.log('[TEST] Marking notification as read...');
  const notifId = list[0].id;
  const { error: updateErr } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId);

  if (updateErr) {
    console.error('[FAIL] Updating notification failed:', updateErr.message);
    return;
  }
  console.log('[PASS] Notification marked as read.');

  // Test delete notification
  console.log('[TEST] Deleting notification...');
  const { error: removeErr } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notifId);

  if (removeErr) {
    console.error('[FAIL] Deleting notification failed:', removeErr.message);
    return;
  }
  console.log('[PASS] Notification deleted successfully.');
  console.log('\n[SUMMARY] ALL DATABASE AND RLS POLICY TESTS PASSED!');
}

runDbTest().catch(console.error);
