import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Querying notifications table from remote Supabase...');
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    console.error('Error fetching notifications:', error);
  } else {
    console.log('Notifications table exists! Sample data:', data);
  }
}

check();
