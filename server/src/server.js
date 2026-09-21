import dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

import app from './app.js';
import { testConnection } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log("║       Dagi's Credit Tracker — Server         ║");
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Test database connection
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('');
    console.error('⚠️  Could not connect to PostgreSQL.');
    console.error('   Make sure PostgreSQL is running and .env is configured correctly.');
    console.error('   Then run: psql -f src/db/schema.sql && psql -f src/db/seed.sql');
    console.error('');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Login:        POST http://localhost:${PORT}/api/auth/login`);
    console.log('');
    console.log('   Default credentials: admin / admin123');
    console.log('');
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});

start();
