const SUPABASE_URL = 'sb_publishable_ne1yXg2GSY-t_1ExVPNZNg_pCwtMcWf';

// Ganti teks di bawah dengan Publishable key
// dari pengaturan API Supabase kamu.
const SUPABASE_PUBLISHABLE_KEY = 'TEMPEL_PUBLISHABLE_KEY_DI_SINI';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;
