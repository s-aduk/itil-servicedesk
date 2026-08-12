require('dotenv').config();

// ── Validate required env vars before anything else ───────────────────────────
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Copy backend/.env.example to backend/.env and fill in all values.\n');
  process.exit(1);
}

const app             = require('./app');
const connectDB       = require('./config/database');
const { startSlaScheduler } = require('./config/slaScheduler');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  startSlaScheduler();
  app.listen(PORT, () => {
    console.log(`\n🚀  ITIL Service Desk — port ${PORT}`);
    console.log(`    Health: http://localhost:${PORT}/api/health\n`);
  });
};

start();
