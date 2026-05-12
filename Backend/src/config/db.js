const path = require('path');
const { env } = require('./env');

const client = (env.db && env.db.client) ? env.db.client.toLowerCase() : 'mysql';

if (client === 'mysql') {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  async function query(sql, params = []) {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    const [rows, fields] = await pool.execute(sql, params);
    if (isSelect) return rows;
    // For insert/update/delete return compatibility object
    return [{ insertId: rows && rows.insertId ? rows.insertId : (rows && rows.affectedRows ? rows.affectedRows : 0), changes: rows && rows.affectedRows ? rows.affectedRows : 0 }];
  }

  async function close() { await pool.end(); }

  module.exports = { query, close, client: 'mysql' };
} else {
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '../../university_portal.sqlite');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  function query(sql, params = []) {
    try {
      const stmt = db.prepare(sql);
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) return stmt.all(...params);
      const result = stmt.run(...params);
      return [{ insertId: result.lastInsertRowid, changes: result.changes }];
    } catch (error) {
      console.error('Database query error:', sql, params, error);
      throw error;
    }
  }

  function close() { db.close(); }

  module.exports = { query, close, client: 'sqlite' };
}
