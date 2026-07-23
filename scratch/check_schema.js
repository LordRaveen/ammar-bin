const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== INSPECTING TEACHERS TABLE COLUMNS ===");

  const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'teachers' });
  if (error) {
    // If RPC doesn't exist, let's query a row and inspect its keys
    const { data: row } = await supabase.from('teachers').select('*').limit(1);
    console.log("Sample Row from teachers table:", row);
  } else {
    console.log("Columns:", cols);
  }

  // Let's also check if there's a foreign key relation or what the ID types are
  const { data: userProfileSample } = await supabase.from('user_profiles').select('*').limit(1);
  console.log("Sample Row from user_profiles table:", userProfileSample);

  process.exit(0);
}

main();
