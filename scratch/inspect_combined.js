process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== INSPECTING CURRENT STATE FOR COMBINED MIGRATION ===\n");

  // 1. Check students table columns
  const { data: studentSample } = await supabase.from('students').select('*').limit(1);
  console.log("--- STUDENTS TABLE SAMPLE ---");
  if (studentSample?.[0]) {
    console.log("Columns:", Object.keys(studentSample[0]).join(', '));
    console.log("Sample:", JSON.stringify(studentSample[0], null, 2));
  }

  // 2. Check student_enrollments table columns
  const { data: enrollSample } = await supabase.from('student_enrollments').select('*').limit(1);
  console.log("\n--- STUDENT_ENROLLMENTS TABLE SAMPLE ---");
  if (enrollSample?.[0]) {
    console.log("Columns:", Object.keys(enrollSample[0]).join(', '));
    console.log("Sample:", JSON.stringify(enrollSample[0], null, 2));
  }

  // 3. Check sections
  const { data: sections } = await supabase.from('sections').select('*');
  console.log("\n--- SECTIONS ---");
  sections?.forEach(s => console.log(`  ID: ${s.id} | Name: ${s.name}`));

  // 4. Check classes grouped by section
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, is_active, section:sections(id, name)')
    .order('name');
  console.log("\n--- CLASSES BY SECTION ---");
  const combined = classes?.filter(c => c.section?.name?.toLowerCase() === 'combined');
  const islamiyya = classes?.filter(c => c.section?.name?.toLowerCase() === 'islamiyya');
  const tahfeez = classes?.filter(c => c.section?.name?.toLowerCase() === 'tahfeez');
  console.log("Islamiyya classes:");
  islamiyya?.forEach(c => console.log(`  ${c.name} (ID: ${c.id}, active: ${c.is_active})`));
  console.log("Tahfeez classes:");
  tahfeez?.forEach(c => console.log(`  ${c.name} (ID: ${c.id}, active: ${c.is_active})`));
  console.log("Combined classes:");
  combined?.forEach(c => console.log(`  ${c.name} (ID: ${c.id}, active: ${c.is_active})`));

  // 5. Check enrollments in combined classes
  const combinedClassIds = combined?.map(c => c.id) || [];
  if (combinedClassIds.length > 0) {
    const { data: combinedEnrollments, count } = await supabase
      .from('student_enrollments')
      .select('*, student:students(id, first_name, last_name, admission_number), class:classes(name, section:sections(name))', { count: 'exact' })
      .in('class_id', combinedClassIds);
    console.log(`\n--- STUDENTS ENROLLED IN COMBINED CLASSES (${count || 0} total) ---`);
    combinedEnrollments?.forEach(e => {
      console.log(`  ${e.student?.first_name} ${e.student?.last_name} (${e.student?.admission_number}) -> ${e.class?.name} (${e.class?.section?.name}) | session: ${e.session_id} | term: ${e.term_id} | active: ${e.is_active}`);
    });
  }

  // 6. Total enrollment stats
  const { count: totalEnrollments } = await supabase
    .from('student_enrollments')
    .select('*', { count: 'exact', head: true });
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  console.log(`\n--- STATS ---`);
  console.log(`Total students: ${totalStudents}`);
  console.log(`Total enrollments: ${totalEnrollments}`);

  process.exit(0);
}

main();
