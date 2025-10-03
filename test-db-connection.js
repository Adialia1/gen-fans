// Simple script to test Supabase database connection
require('dotenv').config();

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('POSTGRES_URL is not set in your .env file');
  process.exit(1);
}

console.log('Testing connection to:', POSTGRES_URL.replace(/:([^@]+)@/, ':***@'));

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Attempting to connect to the database...');
    const client = await pool.connect();
    console.log('✓ Successfully connected to the database!');
    const result = await client.query('SELECT NOW()');
    console.log('✓ Database query successful:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();