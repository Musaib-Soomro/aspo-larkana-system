require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const seedsDir = path.join(__dirname, 'seeds');

  const migrationFiles = fs.readdirSync(migrationsDir).sort();
  console.log(`Running ${migrationFiles.length} migration files...`);

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`  → ${file}`);
    await pool.query(sql);
  }

  console.log('\nRunning seed files...');
  const seedFiles = fs.readdirSync(seedsDir).sort();
  for (const file of seedFiles) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    console.log(`  → ${file}`);
    await pool.query(sql);
  }

  console.log('\nMigration and seeding complete.');
  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
