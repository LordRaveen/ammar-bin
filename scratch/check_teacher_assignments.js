const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== CHECKING TEACHER ASSIGNMENTS IN DATABASE ===");

  // 1. Fetch teachers
  const { data: teachers, error: tErr } = await supabase.from('teachers').select('id, user_id, first_name, last_name, staff_id');
  if (tErr) console.error("Error fetching teachers:", tErr);

  // 2. Fetch user_profiles for teachers
  const { data: userProfiles } = await supabase.from('user_profiles').select('id, first_name, last_name, staff_id').eq('role', 'teacher');

  // 3. Fetch classes with class_teacher_id
  const { data: classes, error: cErr } = await supabase
    .from('classes')
    .select('id, name, class_teacher_id, section:sections(name)');
  if (cErr) console.error("Error fetching classes:", cErr);

  // 4. Fetch teacher_class_assignments
  const { data: classAssigns } = await supabase
    .from('teacher_class_assignments')
    .select('*, class:classes(name)');

  // 5. Fetch teacher_subject_assignments
  const { data: subjectAssigns } = await supabase
    .from('teacher_subject_assignments')
    .select('*, class:classes(name), subject:subjects(name)');

  console.log("\n--- CLASSES & CLASS TEACHERS ---");
  classes?.forEach(c => {
    const teacher = teachers?.find(t => t.id === c.class_teacher_id) || userProfiles?.find(u => u.id === c.class_teacher_id);
    const teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unassigned';
    console.log(`Class: ${c.name} (${c.section?.name || 'No section'}) | Class Lead/Teacher ID: ${c.class_teacher_id || 'null'} -> ${teacherName}`);
  });

  console.log("\n--- TEACHERS WORKLOAD SUMMARY ---");
  teachers?.forEach(t => {
    const fullName = `${t.first_name} ${t.last_name}`;
    const isLeadOf = classes?.filter(c => c.class_teacher_id === t.id).map(c => `${c.name} (${c.section?.name || ''})`);
    
    // Subject assignments
    const taughtSubjects = subjectAssigns?.filter(sa => sa.teacher_id === t.id).map(sa => `${sa.subject?.name} in ${sa.class?.name}`);

    if ((isLeadOf && isLeadOf.length > 0) || (taughtSubjects && taughtSubjects.length > 0)) {
      console.log(`\nTeacher: ${fullName} (Staff ID: ${t.staff_id || 'N/A'}, ID: ${t.id})`);
      console.log(`  - Class Lead of: ${isLeadOf.length > 0 ? isLeadOf.join(', ') : 'None'}`);
      console.log(`  - Taught Subjects: ${taughtSubjects.length > 0 ? taughtSubjects.join(', ') : 'None'}`);
    }
  });

  process.exit(0);
}

main();
