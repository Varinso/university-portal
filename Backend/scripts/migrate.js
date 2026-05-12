const fs = require('fs');
const path = require('path');
const { query, close, client } = require('../src/config/db');

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runMigrations() {
  // Choose migrations folder according to DB client
  const migrationDir = client === 'mysql'
    ? path.join(__dirname, '..', 'db', 'migrations', 'mysql')
    : path.join(__dirname, '..', 'db', 'migrations');

  if (!fs.existsSync(migrationDir)) {
    console.error('Migrations directory not found for client:', client, migrationDir);
    process.exitCode = 1;
    return;
  }

  const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort();

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      const statements = splitSqlStatements(sql);

      for (const statement of statements) {
        // await works for both async (mysql) and sync (sqlite) query implementations
        await query(statement);
      }

      console.log(`Applied migration: ${file}`);
    }

    console.log('All migrations applied successfully.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exitCode = 1;
  } finally {
    try { await close(); } catch (_e) {}
  }
}

runMigrations();
