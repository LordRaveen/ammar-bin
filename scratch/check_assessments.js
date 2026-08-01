const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, subject_id, subject_component_id, class_id')
    .limit(10);
  if (error) {
    console.error(error);
  } else {
    console.log("Assessments:", assessments);
  }
}
main();
