process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Combined -> Tahfeez class mapping (from inspection)
const COMBINED_TO_TAHFEEZ = {
  '53d38549-8e8c-44af-be94-bc3bd0256591': 'b83721bf-ff03-48f6-92f8-6419dc95f880', // Class 1
  '23caafce-9c29-4822-8d5f-f063ac721ef9': '8ef183c2-464e-47f5-8000-3f9602ad6cff', // Class 2
  // Class 3 Combined has NO matching Tahfeez class — we'll create one
  '3864ac65-0b57-495f-93c5-2b776dafd5e8': '9b0269c2-4933-4793-b3e3-12382612096a', // Raudah 1
  '93941ace-874c-4021-a48e-6496b8dafae3': '7e0965b6-7fd3-4796-bbcc-d933b14393c4', // Raudah 2
  '7c27051f-5111-428d-8fae-a63280659f36': 'f946fd07-e4f8-490e-8b94-4b5f965250cf', // Raudah 3
};

const COMBINED_SECTION_ID = '39b0125d-a7cd-4e9f-81b9-b273470bb137';
const TAHFEEZ_SECTION_ID = '507e1567-a9f6-4da4-a524-ef1a41ec794c';
const CLASS3_COMBINED_ID = '0a79412d-1f4e-497f-beab-a813e7650e60';

async function run() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  const cleanConnectionString = connectionString.split('?')[0];

  const pgClient = new Client({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log('Connected to database.\n');

    // =============================================
    // STEP 1: Add enrollment_type column to students
    // =============================================
    console.log('STEP 1: Adding enrollment_type column to students table...');
    await pgClient.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS enrollment_type TEXT NOT NULL DEFAULT 'islamiyya'
    `);
    console.log('  ✅ Column added.\n');

    // Add CHECK constraint separately (so IF NOT EXISTS works for the column)
    try {
      await pgClient.query(`
        ALTER TABLE students 
        ADD CONSTRAINT students_enrollment_type_check 
        CHECK (enrollment_type IN ('islamiyya', 'tahfeez', 'combined'));
      `);
      console.log('  ✅ CHECK constraint added.\n');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  ℹ️  CHECK constraint already exists.\n');
      } else {
        throw e;
      }
    }

    // =============================================
    // STEP 2: Set enrollment_type based on student_id prefix
    // =============================================
    console.log('STEP 2: Setting enrollment_type based on student_id prefix...');
    
    const r1 = await pgClient.query(`
      UPDATE students SET enrollment_type = 'combined' 
      WHERE student_id LIKE 'ABYI/CMB%'
    `);
    console.log(`  ✅ ${r1.rowCount} students marked as 'combined'.`);
    
    const r2 = await pgClient.query(`
      UPDATE students SET enrollment_type = 'tahfeez' 
      WHERE student_id LIKE 'ABYI/TAH%'
    `);
    console.log(`  ✅ ${r2.rowCount} students marked as 'tahfeez'.`);
    
    const r3 = await pgClient.query(`
      UPDATE students SET enrollment_type = 'islamiyya' 
      WHERE student_id LIKE 'ABYI/ISL%' OR student_id LIKE 'ABYI/UMH%'
    `);
    console.log(`  ✅ ${r3.rowCount} students marked as 'islamiyya'.\n`);

    // =============================================
    // STEP 3: Create Class 3 Tahfeez (missing)
    // =============================================
    console.log('STEP 3: Creating Class 3 in Tahfeez section (missing)...');
    const { data: newClass3, error: createErr } = await supabase
      .from('classes')
      .insert({
        name: 'Class 3',
        section_id: TAHFEEZ_SECTION_ID,
        is_active: true,
        capacity: 50,
        class_type: 'primary',
      })
      .select()
      .single();
    
    if (createErr) {
      console.log(`  ⚠️  Error creating Class 3 Tahfeez: ${createErr.message}`);
      // Try to find if it already exists
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('name', 'Class 3')
        .eq('section_id', TAHFEEZ_SECTION_ID)
        .single();
      if (existing) {
        COMBINED_TO_TAHFEEZ[CLASS3_COMBINED_ID] = existing.id;
        console.log(`  ℹ️  Found existing Class 3 Tahfeez: ${existing.id}\n`);
      }
    } else {
      COMBINED_TO_TAHFEEZ[CLASS3_COMBINED_ID] = newClass3.id;
      console.log(`  ✅ Created Class 3 Tahfeez (ID: ${newClass3.id}).\n`);
    }

    // =============================================
    // STEP 4: Migrate Combined enrollments to Tahfeez
    // =============================================
    console.log('STEP 4: Migrating Combined enrollments to Tahfeez classes...');
    
    let migratedCount = 0;
    let errorCount = 0;

    for (const [combinedClassId, tahfeezClassId] of Object.entries(COMBINED_TO_TAHFEEZ)) {
      // Get all active enrollments in this combined class
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('id, student_id, session_id, term_id, class_id')
        .eq('class_id', combinedClassId)
        .eq('is_active', true);

      if (!enrollments || enrollments.length === 0) continue;

      console.log(`  Migrating ${enrollments.length} enrollments from combined ${combinedClassId} -> tahfeez ${tahfeezClassId}`);

      for (const enrollment of enrollments) {
        // Update the enrollment: change class_id from Combined -> Tahfeez
        const { error: updateErr } = await supabase
          .from('student_enrollments')
          .update({ class_id: tahfeezClassId })
          .eq('id', enrollment.id);

        if (updateErr) {
          console.log(`    ❌ Failed to migrate enrollment ${enrollment.id}: ${updateErr.message}`);
          errorCount++;
        } else {
          migratedCount++;
        }
      }
    }

    console.log(`  ✅ Migrated ${migratedCount} enrollments, ${errorCount} errors.\n`);

    // =============================================
    // STEP 5: Deactivate Combined classes
    // =============================================
    console.log('STEP 5: Deactivating Combined classes...');
    const { data: deactivated, error: deactErr } = await supabase
      .from('classes')
      .update({ is_active: false })
      .eq('section_id', COMBINED_SECTION_ID)
      .select('id, name');
    
    if (deactErr) {
      console.log(`  ❌ Error: ${deactErr.message}`);
    } else {
      console.log(`  ✅ Deactivated ${deactivated?.length || 0} combined classes.`);
      deactivated?.forEach(c => console.log(`    - ${c.name} (${c.id})`));
    }

    // =============================================
    // STEP 6: Verify
    // =============================================
    console.log('\n=== VERIFICATION ===');
    
    // Check enrollment types
    const { data: typeCounts } = await supabase
      .rpc('get_enrollment_type_counts')
      .select('*');
    
    // Manual count fallback
    const types = ['islamiyya', 'tahfeez', 'combined'];
    for (const t of types) {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('enrollment_type', t);
      console.log(`  Students with enrollment_type '${t}': ${count}`);
    }

    // Check no active enrollments remain in combined classes
    const combinedIds = Object.keys(COMBINED_TO_TAHFEEZ);
    const { count: remainingCombined } = await supabase
      .from('student_enrollments')
      .select('*', { count: 'exact', head: true })
      .in('class_id', combinedIds)
      .eq('is_active', true);
    console.log(`  Active enrollments still in combined classes: ${remainingCombined}`);

    // Check combined students now have tahfeez enrollments
    const { data: sampleCombined } = await supabase
      .from('students')
      .select('id, student_id, first_name, last_name')
      .eq('enrollment_type', 'combined')
      .limit(3);
    
    for (const s of sampleCombined || []) {
      const { data: enrolls } = await supabase
        .from('student_enrollments')
        .select('class:classes(name, section:sections(name))')
        .eq('student_id', s.id)
        .eq('is_active', true);
      console.log(`  ${s.first_name} ${s.last_name}: ${enrolls?.map(e => `${e.class?.name}(${e.class?.section?.name})`).join(' + ')}`);
    }

    console.log('\n✅ Migration complete!');

  } catch (err) {
    console.error('Migration failed:', err.message);
    console.error(err);
  } finally {
    await pgClient.end();
    console.log('Database connection closed.');
  }
}

run();
