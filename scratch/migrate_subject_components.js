process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING not found in .env');
    process.exit(1);
  }

  // Clean connection string
  const cleanConnectionString = connectionString.split('?')[0];

  const client = new Client({
    connectionString: cleanConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database successfully.');

    // 1. Create subject_components table
    console.log('Creating public.subject_components table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.subject_components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(subject_id, name)
      );
    `);
    console.log('Successfully created public.subject_components table.');

    // 2. Add subject_component_id to assessments
    console.log('Adding subject_component_id to public.assessments...');
    await client.query(`
      ALTER TABLE public.assessments 
      ADD COLUMN IF NOT EXISTS subject_component_id UUID REFERENCES public.subject_components(id) ON DELETE SET NULL;
    `);
    console.log('Successfully added subject_component_id to public.assessments.');

    // 3. Drop existing unique constraints on public.assessments
    console.log('Dropping unique constraints on assessments to replace with partial indexes...');
    const constraintQuery = `
      SELECT conname FROM pg_constraint 
      WHERE conrelid = 'public.assessments'::regclass AND contype = 'u';
    `;
    const constraintsRes = await client.query(constraintQuery);
    for (const row of constraintsRes.rows) {
      console.log(`Dropping constraint: ${row.conname}`);
      await client.query(`ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS "${row.conname}" CASCADE;`);
    }

    // 4. Create partial unique indexes on public.assessments
    console.log('Creating partial unique indexes on assessments...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS assessments_no_comp_unique 
      ON public.assessments (session_id, term_id, class_id, subject_id, assessment_type_id) 
      WHERE subject_component_id IS NULL;
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS assessments_with_comp_unique 
      ON public.assessments (session_id, term_id, class_id, subject_id, assessment_type_id, subject_component_id) 
      WHERE subject_component_id IS NOT NULL;
    `);
    console.log('Successfully created partial unique indexes.');

    // 5. Create behavior_categories table
    console.log('Creating behavior_categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.behavior_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('affective', 'psychomotor')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(name, type)
      );
    `);
    console.log('Successfully created behavior_categories.');

    // 6. Create student_behavior_grades table
    console.log('Creating student_behavior_grades table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.student_behavior_grades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
        term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
        behavior_category_id UUID NOT NULL REFERENCES public.behavior_categories(id) ON DELETE CASCADE,
        score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(student_id, session_id, term_id, class_id, behavior_category_id)
      );
    `);
    console.log('Successfully created student_behavior_grades.');

    // 7. Seed standard Behavior Categories
    console.log('Seeding default Affective and Psychomotor behavior categories...');
    const seedCategories = [
      // Affective
      { name: 'Punctuality', type: 'affective' },
      { name: 'Neatness', type: 'affective' },
      { name: 'Politeness', type: 'affective' },
      { name: 'Honesty', type: 'affective' },
      { name: 'Relationship with Peers', type: 'affective' },
      { name: 'Attentiveness', type: 'affective' },
      // Psychomotor
      { name: 'Handwriting', type: 'psychomotor' },
      { name: 'Sports & Games', type: 'psychomotor' },
      { name: 'Manual Skills', type: 'psychomotor' },
      { name: 'Speech', type: 'psychomotor' },
    ];

    for (const cat of seedCategories) {
      await client.query(`
        INSERT INTO public.behavior_categories (name, type)
        VALUES ($1, $2)
        ON CONFLICT (name, type) DO NOTHING;
      `, [cat.name, cat.type]);
    }
    console.log('Seeding finished successfully.');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
