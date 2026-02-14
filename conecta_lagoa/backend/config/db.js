
const dbType = process.env.DB_TYPE || 'pg';

let db, initDatabase, query;

if (dbType === 'postgres') {
  // Usar PostgreSQL
  console.log('📊 Usando PostgreSQL');
  const postgres = require('./database-postgres');
  db = postgres.pool;
  initDatabase = postgres.initDatabase;
  query = postgres.query;
} else {
  // Usar SQLite (padrão)
  console.log('📊 Usando Postgres');
  const sqlite = require('./database');
  db = sqlite.db;
  initDatabase = postgres.initDatabase;
  query = null; 
}

module.exports = {
  db,
  initDatabase,
  query,
  dbType
};
