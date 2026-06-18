import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function trySignUpOwner() {
  console.log('Trying to sign up owner@rentease.com on the remote Supabase...');
  const { data, error } = await supabase.auth.signUp({
    email: 'owner@rentease.com',
    password: 'Devansh@2006'
  });
  if (error) {
    console.error('Sign up error:', error.message);
  } else {
    console.log('Sign up success! User:', data.user);
  }
}

trySignUpOwner();
