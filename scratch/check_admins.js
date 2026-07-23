const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== CHECKING ADMINS IN TEACHERS TABLE ===");

  const { data: admins } = await supabase
    .from('teachers')
    .select('id, first_name, last_name, role, email');
  console.log("Teachers rows in DB:", admins);

  process.exit(0);
}

main();
