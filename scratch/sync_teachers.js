const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== COMPARING user_profiles VS teachers ===");

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'teacher');

  const { data: teachers } = await supabase
    .from('teachers')
    .select('*');

  console.log(`Found ${profiles.length} teachers in user_profiles`);
  console.log(`Found ${teachers.length} teachers in teachers table`);

  // Print profiles not in teachers
  for (const p of profiles) {
    const tMatch = teachers.find(t => t.email === p.email || t.user_id === p.user_id);
    if (!tMatch) {
      console.log(`Missing teacher: ${p.first_name} ${p.last_name} (${p.email}), ID: ${p.id}, user_id: ${p.user_id}`);
      
      // Let's insert this missing teacher record with user_id: null to bypass missing auth user!
      const insertData = {
        user_id: null,
        staff_id: p.staff_id || `STAFF/TEMP/${Date.now().toString().slice(-4)}`,
        first_name: p.first_name,
        middle_name: p.middle_name,
        last_name: p.last_name,
        email: p.email,
        phone: p.phone,
        gender: p.gender,
        date_of_birth: p.date_of_birth,
        address: p.address,
        qualification: p.qualification,
        specialization: p.specialization,
        employment_date: new Date().toISOString().split('T')[0],
        employment_type: p.employment_type || 'Full-time',
        status: p.status || 'Active',
        role: 'Teacher',
      };
      
      const { data: inserted, error } = await supabase
        .from('teachers')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error(`Error inserting ${p.first_name} with user_id null:`, error);
      } else {
        console.log(`Inserted successfully with user_id null: ${inserted.first_name} ${inserted.last_name} (New Teacher ID: ${inserted.id})`);
      }
    } else {
      console.log(`Matched teacher: ${p.first_name} ${p.last_name} -> ID in user_profiles: ${p.id}, ID in teachers: ${tMatch.id}`);
    }
  }

  process.exit(0);
}

main();
