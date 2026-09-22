import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'dagi_credit',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new pg.Pool(poolConfig);

// Log connection events
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
  process.exit(-1);
});

/**
 * Test the database connection.
 */
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected at:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

export default pool;
