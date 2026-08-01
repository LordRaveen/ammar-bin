const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, class_id, class:classes(name), subject_id, subject:subjects(name), subject_component_id, subject_component:subject_components(name)')
    .not('subject_component_id', 'is', null);

  if (error) {
    console.error(error);
  } else {
    console.log("Component-based Assessments:", assessments.map(a => ({
      id: a.id,
      class_name: a.class?.name,
      class_id: a.class_id,
      subject: a.subject?.name,
      component: a.subject_component?.name
    })));
  }
}
main();
