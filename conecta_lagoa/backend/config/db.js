
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


const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// ==============================
// CRIAR TABELAS (se não existirem)
// ==============================
async function initDB() {
  try {
    // Empresas
    await sql`
      CREATE TABLE IF NOT EXISTS empresas (
        id          SERIAL PRIMARY KEY,
        nome        VARCHAR(200) NOT NULL,
        email       VARCHAR(200) UNIQUE NOT NULL,
        senha_hash  TEXT NOT NULL,
        logo_url    TEXT,
        setor       VARCHAR(100),
        cidade      VARCHAR(100),
        telefone    VARCHAR(30),
        site        VARCHAR(200),
        plano       VARCHAR(20) DEFAULT 'basico',  -- basico | pro | enterprise
        ativo       BOOLEAN DEFAULT TRUE,
        criado_em   TIMESTAMP DEFAULT NOW()
      )
    `;

    // Vagas
    await sql`
      CREATE TABLE IF NOT EXISTS vagas (
        id            SERIAL PRIMARY KEY,
        empresa_id    INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        titulo        VARCHAR(200) NOT NULL,
        descricao     TEXT,
        area          VARCHAR(100),
        cidade        VARCHAR(100),
        tipo          VARCHAR(50),   -- CLT | PJ | Estágio | Freelance
        salario_min   NUMERIC(10,2),
        salario_max   NUMERIC(10,2),
        status        VARCHAR(20) DEFAULT 'ativa',  -- ativa | pausada | encerrada
        criado_em     TIMESTAMP DEFAULT NOW(),
        encerrado_em  TIMESTAMP
      )
    `;

    // Candidatos
    await sql`
      CREATE TABLE IF NOT EXISTS candidatos (
        id          SERIAL PRIMARY KEY,
        nome        VARCHAR(200) NOT NULL,
        email       VARCHAR(200) UNIQUE NOT NULL,
        senha_hash  TEXT NOT NULL,
        telefone    VARCHAR(30),
        cidade      VARCHAR(100),
        area        VARCHAR(100),
        curriculo   TEXT,
        criado_em   TIMESTAMP DEFAULT NOW()
      )
    `;

    // Candidaturas
    await sql`
      CREATE TABLE IF NOT EXISTS candidaturas (
        id            SERIAL PRIMARY KEY,
        vaga_id       INTEGER REFERENCES vagas(id) ON DELETE CASCADE,
        candidato_id  INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
        status        VARCHAR(30) DEFAULT 'pendente', -- pendente | em_analise | aprovado | rejeitado | contratado
        mensagem      TEXT,
        criado_em     TIMESTAMP DEFAULT NOW(),
        UNIQUE(vaga_id, candidato_id)
      )
    `;

    // Favoritos (empresa salvou candidato)
    await sql`
      CREATE TABLE IF NOT EXISTS favoritos (
        id            SERIAL PRIMARY KEY,
        empresa_id    INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        candidato_id  INTEGER REFERENCES candidatos(id) ON DELETE CASCADE,
        criado_em     TIMESTAMP DEFAULT NOW(),
        UNIQUE(empresa_id, candidato_id)
      )
    `;

    // Mensagens
    await sql`
      CREATE TABLE IF NOT EXISTS mensagens (
        id            SERIAL PRIMARY KEY,
        de_empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
        para_candidato_id INTEGER REFERENCES candidatos(id) ON DELETE SET NULL,
        assunto       VARCHAR(200),
        conteudo      TEXT,
        lida          BOOLEAN DEFAULT FALSE,
        criado_em     TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
    throw err;
  }
}

module.exports = { sql, initDB };
