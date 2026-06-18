import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function trySignInAdmin() {
  const passwords = ['Devansh@2006', 'password', 'admin@2006'];
  for (const password of passwords) {
    console.log(`Trying admin@rentease.com with password: ${password}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@rentease.com',
      password
    });
    if (!error) {
      console.log(`[SUCCESS] Logged in successfully as admin with password: ${password}!`);
      return;
    } else {
      console.log(`[FAILED] Error: ${error.message}`);
    }
  }
}

trySignInAdmin();
