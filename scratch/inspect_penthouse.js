import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPenthouse() {
  console.log('Querying remote Supabase for Urban Chic Penthouse...');
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .ilike('title', '%Urban Chic Penthouse%');

  if (error) {
    console.error('Error fetching Urban Chic Penthouse:', error);
  } else {
    console.log('SQL Query Results length:', data.length);
    console.log('Property data:', JSON.stringify(data, null, 2));
  }
}

inspectPenthouse();
