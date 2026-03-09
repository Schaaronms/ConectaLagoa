const { pool, query, initDatabase } = require('./database-postgres');

pool.connect()
  .then(() => console.log('✅ PostgreSQL conectado com sucesso!'))
  .catch(() => console.log('❌ Erro ao conectar ao PostgreSQL'));

module.exports = {
  db: pool,
  pool,
  query,
  initDatabase,
  dbType: 'postgres'
};