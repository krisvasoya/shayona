import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runSchema() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:Cristoz%24%23%406600@db.aesebdzwurpisuqfmksw.supabase.co:5432/postgres';

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    const schemaPath = path.resolve(__dirname, '../../../supabase_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying database schema and RLS policies...');
    await client.query(sql);

    console.log('All tables, indexes, and RLS policies have been applied to Supabase successfully!');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Verified Public Tables in Database:');
    res.rows.forEach((r) => console.log(' - ' + r.table_name));
  } catch (err: any) {
    console.error('Database migration error:', err.message || err);
  } finally {
    await client.end();
  }
}

runSchema();
