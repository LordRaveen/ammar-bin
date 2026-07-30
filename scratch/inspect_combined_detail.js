process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== FULL COMBINED ENROLLMENT MAPPING ===\n");

  // Get all combined class IDs
  const { data: combinedClasses } = await supabase
    .from('classes')
    .select('id, name, section:sections(name)')
    .eq('section_id', '39b0125d-a7cd-4e9f-81b9-b273470bb137'); // Combined section ID

  // Get all tahfeez classes
  const { data: tahfeezClasses } = await supabase
    .from('classes')
    .select('id, name, section:sections(name)')
    .eq('section_id', '507e1567-a9f6-4da4-a524-ef1a41ec794c'); // Tahfeez section ID

  console.log("--- COMBINED -> TAHFEEZ CLASS MAPPING ---");
  combinedClasses?.forEach(cc => {
    const matchingTahfeez = tahfeezClasses?.find(tc => tc.name.toLowerCase().trim() === cc.name.toLowerCase().trim());
    console.log(`  ${cc.name} (Combined: ${cc.id}) -> ${matchingTahfeez ? `${matchingTahfeez.name} (Tahfeez: ${matchingTahfeez.id})` : 'NO MATCH'}`);
  });

  // Get all enrollments in combined classes with student info
  const combinedIds = combinedClasses?.map(c => c.id) || [];
  const { data: combinedEnrollments } = await supabase
    .from('student_enrollments')
    .select('id, student_id, class_id, session_id, term_id, is_active, student:students(student_id, first_name, last_name), class:classes(name)')
    .in('class_id', combinedIds)
    .eq('is_active', true);

  console.log(`\n--- COMBINED ENROLLMENTS TO MIGRATE (${combinedEnrollments?.length || 0}) ---`);
  
  // Group by combined class
  const grouped = {};
  combinedEnrollments?.forEach(e => {
    const className = e.class?.name;
    if (!grouped[className]) grouped[className] = [];
    grouped[className].push(e);
  });

  Object.entries(grouped).forEach(([className, enrollments]) => {
    console.log(`\n  ${className} (Combined) -> should move to ${className} (Tahfeez):`);
    enrollments.forEach(e => {
      console.log(`    ${e.student?.student_id} | ${e.student?.first_name} ${e.student?.last_name} | enrollment: ${e.id}`);
    });
  });

  // Check if any CMB student does NOT have an Islamiyya enrollment
  const cmbStudentIds = [...new Set(combinedEnrollments?.map(e => e.student_id) || [])];
  console.log(`\n--- CHECKING IF ALL ${cmbStudentIds.length} COMBINED STUDENTS HAVE ISLAMIYYA ENROLLMENTS ---`);
  
  for (const studentId of cmbStudentIds.slice(0, 5)) {
    const { data: allEnrolls } = await supabase
      .from('student_enrollments')
      .select('class:classes(name, section:sections(name))')
      .eq('student_id', studentId)
      .eq('is_active', true);
    const student = combinedEnrollments?.find(e => e.student_id === studentId);
    console.log(`  ${student?.student?.first_name} ${student?.student?.last_name}: ${allEnrolls?.map(e => `${e.class?.name}(${e.class?.section?.name})`).join(' + ')}`);
  }

  process.exit(0);
}

main();
