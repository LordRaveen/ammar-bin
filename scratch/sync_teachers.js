const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE ROLE KEY in environment variables.");
  process.exit(1);
}

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

  for (const p of profiles) {
    const tMatch = teachers.find(t => t.email?.toLowerCase() === p.email?.toLowerCase());
    
    if (tMatch) {
      // If user_id is missing or doesn't match, update it
      if (tMatch.user_id !== p.user_id) {
        console.log(`Linking user_id for existing teacher: ${p.first_name} ${p.last_name} (${p.email})`);
        const { error } = await supabase
          .from('teachers')
          .update({ user_id: p.user_id })
          .eq('id', tMatch.id);
        
        if (error) {
          console.error(`Error linking user_id:`, error.message);
        } else {
          console.log(`Linked successfully.`);
        }
      } else {
        console.log(`Matched and linked teacher: ${p.first_name} ${p.last_name} (${p.email})`);
      }
    } else {
      console.log(`Missing teacher: ${p.first_name} ${p.last_name} (${p.email}), ID: ${p.id}, user_id: ${p.user_id}`);
      
      const insertData = {
        user_id: p.user_id,
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
        employment_date: p.employment_date || new Date().toISOString().split('T')[0],
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
        console.error(`Error inserting teacher:`, error.message);
      } else {
        console.log(`Inserted successfully: ${inserted.first_name} ${inserted.last_name} (New Teacher ID: ${inserted.id})`);
      }
    }
  }

  console.log("=== SYNC COMPLETED ===");
  process.exit(0);
}

main().catch(console.error);
