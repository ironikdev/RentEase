import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function trySignIn() {
  const passwords = ['Devansh@2006', 'password', 'owner@2006'];
  for (const password of passwords) {
    console.log(`Trying owner@rentease.com with password: ${password}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'owner@rentease.com',
      password
    });
    if (!error) {
      console.log(`[SUCCESS] Logged in successfully with password: ${password}!`);
      console.log('User ID:', data.user.id);
      return;
    } else {
      console.log(`[FAILED] Error: ${error.message}`);
    }
  }
}

trySignIn();
