process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING not found in .env');
    process.exit(1);
  }

  // Clean connection string query params that might override SSL behavior
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

    // 1. Add school_type to subjects
    console.log('Adding school_type to subjects table...');
    await client.query(`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS school_type TEXT NOT NULL DEFAULT 'islamiyya' 
      CHECK (school_type IN ('tahfeez', 'islamiyya'));
    `);
    console.log('Successfully added school_type to subjects.');

    // 2. Add class_type to classes
    console.log('Adding class_type to classes table...');
    await client.query(`
      ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS class_type TEXT NOT NULL DEFAULT 'primary' 
      CHECK (class_type IN ('nursery', 'primary'));
    `);
    console.log('Successfully added class_type to classes.');

    // 3. Automatically update Raudah classes to 'nursery' class_type
    console.log('Updating Raudah/Nursery class types...');
    const result = await client.query(`
      UPDATE classes 
      SET class_type = 'nursery' 
      WHERE LOWER(name) LIKE '%raudah%' 
         OR LOWER(name) LIKE '%nursery%' 
         OR LOWER(name) LIKE '%pre-nursery%';
    `);
    console.log(`Successfully updated ${result.rowCount} classes to nursery.`);

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
