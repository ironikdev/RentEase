import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log('--- Verification 1 & 2: profiles table structure ---');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(1);

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else {
    console.log('Sample profile ID:', profileData[0]?.id);
    console.log('Is profile ID a valid UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileData[0]?.id));
  }

  console.log('\n--- Verification 3: properties table ID structure ---');
  const { data: propData, error: propError } = await supabase
    .from('properties')
    .select('id, title')
    .limit(1);

  if (propError) {
    console.error('Error fetching property:', propError);
  } else {
    console.log('Sample property ID:', propData[0]?.id);
    console.log('Is property ID a valid UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propData[0]?.id));
  }
}

verify();
