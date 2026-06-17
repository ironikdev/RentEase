const supabaseUrl = 'https://ztkwcalxylmgpejxacek.supabase.co';
const supabaseAnonKey = 'sb_publishable_nQDXuIiuIqxDgPA60WLf9g_hUmhxJni';

async function listTables() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body length:', body.length);
    console.log('Body start:', body.substring(0, 500));
  } catch (err) {
    console.error('Error listing tables:', err);
  }
}

listTables();
