// Helper para executar queries em SQLite ou PostgreSQL
const dbType = process.env.DB_TYPE || 'sqlite';

let db, query;

if (dbType === 'postgres') {
  const { pool } = require('./database-postgres');
  db = pool;
  
  // Função de query para PostgreSQL
  query = async (text, params = []) => {
    try {
      const result = await pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('Erro na query PostgreSQL:', error);
      throw error;
    }
  };
  
  // Função get (retorna uma linha)
  query.get = async (text, params = []) => {
    const rows = await query(text, params);
    return rows[0] || null;
  };
  
  // Função run (INSERT/UPDATE/DELETE)
  query.run = async (text, params = []) => {
    const result = await pool.query(text, params);
    return {
      lastID: result.rows[0]?.id,
      changes: result.rowCount
    };
  };
  
  // Função all (retorna todas as linhas)
  query.all = async (text, params = []) => {
    return await query(text, params);
  };
  
} else {
  // SQLite
  const { db: sqliteDb } = require('./database');
  db = sqliteDb;
  
  // Wrapper promises para SQLite
  query = {
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    },
    
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
  };
}

module.exports = { db, query, dbType };
