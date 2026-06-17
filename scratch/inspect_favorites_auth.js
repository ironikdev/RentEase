import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = 'devansh@gmail.com';
  const password = 'Devansh@2006';
  
  console.log(`Signing in user: ${email}...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Sign in error:', signInError.message);
    return;
  }

  const user = signInData.user;
  console.log('Successfully signed in user ID:', user.id);

  console.log('Querying favorites table as authenticated user...');
  const { data: favData, error: favError } = await supabase
    .from('favorites')
    .select('*');

  if (favError) {
    console.error('Favorites query error:', favError.message, favError.code);
  } else {
    console.log('Favorites query success! Data:', favData);
  }
}

test();
