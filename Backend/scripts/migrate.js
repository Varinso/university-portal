const fs = require('fs');
const path = require('path');
const { db, query } = require('../src/config/db');

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function runMigrations() {
  const migrationDir = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort();

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      const statements = splitSqlStatements(sql);

      for (const statement of statements) {
        query(statement);
      }

      console.log(`Applied migration: ${file}`);
    }

    console.log('All migrations applied successfully.');
  } catch (error) {
    console.error('Migration error:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

runMigrations();
