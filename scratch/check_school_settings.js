const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== INSPECTING SCHOOL SETTINGS ===");
  const { data, error } = await supabase.from('school_settings').select('*').limit(1);
  if (error) {
    console.error("Error fetching school_settings:", error);
  } else {
    console.log("School Settings columns and values:", data);
  }
  process.exit(0);
}

main();
