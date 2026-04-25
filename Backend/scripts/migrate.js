const fs = require('fs');
const path = require('path');
const { query, pool } = require('../src/config/db');

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runMigrations() {
  const migrationDir = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    const statements = splitSqlStatements(sql);

    for (const statement of statements) {
      await query(statement);
    }

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
