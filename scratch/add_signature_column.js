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

    console.log('Adding principal_signature_url to school_settings table...');
    await client.query(`
      ALTER TABLE school_settings 
      ADD COLUMN IF NOT EXISTS principal_signature_url TEXT DEFAULT NULL;
    `);
    console.log('Successfully added principal_signature_url to school_settings.');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
