process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING not found in .env');
    process.exit(1);
  }

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

    // 1. Create class_subject_components table
    console.log('Creating class_subject_components table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.class_subject_components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
        subject_component_id UUID NOT NULL REFERENCES public.subject_components(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(class_id, subject_id, subject_component_id)
      );
    `);
    console.log('Successfully created class_subject_components.');

    // 2. Seed existing class_subject_components
    console.log('Auto-populating class_subject_components for existing mappings...');
    const result = await client.query(`
      INSERT INTO public.class_subject_components (class_id, subject_id, subject_component_id)
      SELECT cs.class_id, cs.subject_id, sc.id
      FROM public.class_subjects cs
      JOIN public.subject_components sc ON sc.subject_id = cs.subject_id
      ON CONFLICT (class_id, subject_id, subject_component_id) DO NOTHING;
    `);
    console.log(`Auto-seeded ${result.rowCount} rows into class_subject_components.`);

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
