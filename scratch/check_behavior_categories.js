const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBehaviorCategories() {
  const { data, error } = await supabase
    .from('behavior_categories')
    .select('*')
    .eq('is_active', true)
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching behavior categories:', error);
    return;
  }

  console.log('ACTIVE BEHAVIOR CATEGORIES:');
  console.log(JSON.stringify(data, null, 2));
}

checkBehaviorCategories();
