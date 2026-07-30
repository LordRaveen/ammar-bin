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

    // 1. Find the name of the unique constraint on student_enrollments
    console.log('Querying existing unique/primary constraints on student_enrollments...');
    const constraintRes = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as condef
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.conrelid = 'student_enrollments'::regclass;
    `);
    
    console.log('Constraints found:', constraintRes.rows);

    // Look for unique constraint on (student_id, session_id)
    const targetConstraint = constraintRes.rows.find(row => 
      row.condef.includes('UNIQUE') && 
      row.condef.includes('student_id') && 
      row.condef.includes('session_id') && 
      !row.condef.includes('class_id')
    );

    if (targetConstraint) {
      console.log(`Dropping constraint: ${targetConstraint.conname}...`);
      await client.query(`
        ALTER TABLE student_enrollments 
        DROP CONSTRAINT ${targetConstraint.conname};
      `);
      console.log('Successfully dropped old unique constraint.');
    } else {
      console.log('No matching unique constraint to drop (it might have been dropped already).');
    }

    // 2. Add new unique constraint on (student_id, session_id, class_id)
    console.log('Adding new unique constraint on (student_id, session_id, class_id)...');
    try {
      await client.query(`
        ALTER TABLE student_enrollments 
        ADD CONSTRAINT student_enrollments_student_session_class_key 
        UNIQUE (student_id, session_id, class_id);
      `);
      console.log('Successfully added new unique constraint!');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Constraint student_enrollments_student_session_class_key already exists.');
      } else {
        throw e;
      }
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
