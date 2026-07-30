process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check if students already have enrollment_type-like columns
  const { data: students } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name')
    .limit(5);
  
  console.log("--- SAMPLE STUDENTS ---");
  students?.forEach(s => console.log(`  ${s.student_id} | ${s.first_name} ${s.last_name}`));

  // Check student_id prefixes to see if there's a pattern for combined vs islamiyya vs tahfeez
  const { data: allStudents } = await supabase
    .from('students')
    .select('student_id')
    .order('student_id');
  
  const prefixes = {};
  allStudents?.forEach(s => {
    // Extract prefix like ABYI/CMB, ABYI/ISL, etc.
    const parts = s.student_id?.split('/');
    if (parts && parts.length >= 2) {
      const prefix = `${parts[0]}/${parts[1]}`;
      prefixes[prefix] = (prefixes[prefix] || 0) + 1;
    }
  });
  console.log("\n--- STUDENT ID PREFIXES (enrollment type indicators) ---");
  Object.entries(prefixes).sort((a,b) => b[1] - a[1]).forEach(([prefix, count]) => {
    console.log(`  ${prefix}: ${count} students`);
  });

  // Check enrollments - see which sections students are enrolled in
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('student_id, class:classes(name, section:sections(name))')
    .eq('is_active', true);

  // Group by student to see if any student has multiple enrollments
  const studentEnrollMap = {};
  enrollments?.forEach(e => {
    if (!studentEnrollMap[e.student_id]) studentEnrollMap[e.student_id] = [];
    studentEnrollMap[e.student_id].push(`${e.class?.name} (${e.class?.section?.name})`);
  });

  const multiEnrolled = Object.entries(studentEnrollMap).filter(([_, classes]) => classes.length > 1);
  console.log(`\n--- MULTI-ENROLLED STUDENTS (${multiEnrolled.length}) ---`);
  multiEnrolled.slice(0, 10).forEach(([studentId, classes]) => {
    console.log(`  Student ${studentId}: ${classes.join(' + ')}`);
  });

  process.exit(0);
}

main();
