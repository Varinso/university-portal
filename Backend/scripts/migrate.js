const fs = require('fs');
const path = require('path');
const { query, pool } = require('../src/config/db');

async function runMigrations() {
  const migrationDir = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    await query(sql);
    console.log(`Applied migration: ${file}`);
  }

  console.log('All migrations applied.');
}

runMigrations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
