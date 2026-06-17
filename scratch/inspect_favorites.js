import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTables() {
  const tables = ['bookings', 'messages', 'notifications', 'wishlist', 'favorite', 'favorites'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}': error:`, error.message);
    } else {
      console.log(`Table '${t}': EXISTS and is queryable!`);
    }
  }
}

testTables();
