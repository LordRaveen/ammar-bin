const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== FIXING MISMATCHED TEACHER IDS IN THE DATABASE ===");

  // Define the map of user_profiles.id to teachers.id for affected teachers
  // Grace Okoroafor: 1b273be4-58da-411a-b4b7-82910bb4f955 -> 9267c2f4-b280-4529-8bf1-0df46a35f2a7
  const idMap = {
    '1b273be4-58da-411a-b4b7-82910bb4f955': '9267c2f4-b280-4529-8bf1-0df46a35f2a7'
  };

  for (const [oldId, newId] of Object.entries(idMap)) {
    console.log(`\nMapping old ID ${oldId} -> new ID ${newId}`);

    // Update classes
    const { data: updatedClasses, error: cErr } = await supabase
      .from('classes')
      .update({ class_teacher_id: newId })
      .eq('class_teacher_id', oldId)
      .select();
    if (cErr) console.error("Error updating classes:", cErr);
    else console.log(`Updated class teacher ID for ${updatedClasses?.length || 0} classes`);

    // Update teacher_class_assignments
    const { data: updatedClassAssigns, error: caErr } = await supabase
      .from('teacher_class_assignments')
      .update({ teacher_id: newId })
      .eq('teacher_id', oldId)
      .select();
    if (caErr) console.error("Error updating teacher_class_assignments:", caErr);
    else console.log(`Updated teacher_id for ${updatedClassAssigns?.length || 0} class assignments`);

    // Update teacher_subject_assignments
    const { data: updatedSubAssigns, error: saErr } = await supabase
      .from('teacher_subject_assignments')
      .update({ teacher_id: newId })
      .eq('teacher_id', oldId)
      .select();
    if (saErr) console.error("Error updating teacher_subject_assignments:", saErr);
    else console.log(`Updated teacher_id for ${updatedSubAssigns?.length || 0} subject assignments`);
  }

  process.exit(0);
}

main();
