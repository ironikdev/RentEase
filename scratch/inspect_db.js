import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log('Fetching a single property from remote Supabase...');
  const { data, error } = await supabase.from('properties').select('*').limit(1);
  if (error) {
    console.error('Error fetching properties:', error);
  } else {
    console.log('Properties columns:', data[0] ? Object.keys(data[0]) : 'No properties found');
    console.log('Sample property data:', data[0]);
  }
}

inspect();
