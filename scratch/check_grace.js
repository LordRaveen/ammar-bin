const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== CHECKING GRACE OKOROAFOR RECORDS ===");

  // Check user_profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('first_name', '%grace%');
  console.log("User Profiles matching Grace:", profiles);

  // Check teachers
  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .ilike('first_name', '%grace%');
  console.log("Teachers matching Grace:", teachers);

  process.exit(0);
}

main();
