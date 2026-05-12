const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../university_portal.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    // Determine if this is a SELECT query
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect) {
      return stmt.all(...params);
    } else {
      // For INSERT/UPDATE/DELETE, return the result
      const result = stmt.run(...params);
      // Return array with insertId in first element for compatibility
      return [{ insertId: result.lastInsertRowid, changes: result.changes }];
    }
  } catch (error) {
    console.error('Database query error:', sql, params, error);
    throw error;
  }
}

module.exports = { db, query };
