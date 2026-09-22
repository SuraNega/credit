import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCleanMigration() {
  console.log('🔄 Connecting to database and running clean initialization...');
  try {
    const sqlPath = path.join(__dirname, 'init_clean.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Clean database initialized successfully!');
    console.log('--------------------------------------------------');
    console.log('Admin Account Created:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('--------------------------------------------------');
    console.log('All mock customers, credits, and payments removed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runCleanMigration();
