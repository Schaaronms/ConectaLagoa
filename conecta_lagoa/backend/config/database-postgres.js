const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'conecta_lagoa',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '43182436',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.on('connect', () => {
  console.log('✓ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no PostgreSQL:', err);
  process.exit(-1);
});

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executou query', { text, duration, rows: res.rowCount });
  return res;
};

// Função para inicializar o banco de dados
const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Inicializando banco de dados PostgreSQL...');

    // Habilitar extensões
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Tabela de Empresas
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        cnpj VARCHAR(18),
        telefone VARCHAR(20),
        endereco TEXT,
        cidade VARCHAR(100),
        estado VARCHAR(2),
        descricao TEXT,
        logo_url VARCHAR(500),
        plano VARCHAR(50) DEFAULT 'free',
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_acesso TIMESTAMP
      )
    `);

    // Tabela de Candidatos
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidatos (
        id SERIAL PRIMARY KEY,
        nome_completo VARCHAR(200) NOT NULL,
        email VARCHAR(200) UNIQUE NOT NULL,
        telefone VARCHAR(20),
        data_nascimento DATE,
        cpf VARCHAR(14),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        endereco TEXT,
        sobre_mim TEXT,
        linkedin_url VARCHAR(500),
        portfolio_url VARCHAR(500),
        curriculo_url VARCHAR(500),
        foto_url VARCHAR(500),
        ativo BOOLEAN DEFAULT true,
        data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Experiências Profissionais
    await client.query(`
      CREATE TABLE IF NOT EXISTS experiencias (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        cargo VARCHAR(200) NOT NULL,
        empresa VARCHAR(200) NOT NULL,
        descricao TEXT,
        data_inicio DATE NOT NULL,
        data_fim DATE,
        atual BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Formação Acadêmica
    await client.query(`
      CREATE TABLE IF NOT EXISTS formacoes (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        instituicao VARCHAR(200) NOT NULL,
        curso VARCHAR(200) NOT NULL,
        nivel VARCHAR(50) NOT NULL,
        data_inicio DATE,
        data_conclusao DATE,
        situacao VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Habilidades
    await client.query(`
      CREATE TABLE IF NOT EXISTS habilidades (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        nivel VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Idiomas
    await client.query(`
      CREATE TABLE IF NOT EXISTS idiomas (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        idioma VARCHAR(50) NOT NULL,
        nivel VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Visualizações
    await client.query(`
      CREATE TABLE IF NOT EXISTS visualizacoes (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        data_visualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Favoritos
    await client.query(`
      CREATE TABLE IF NOT EXISTS favoritos (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        data_favoritado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notas TEXT,
        UNIQUE(empresa_id, candidato_id)
      )
    `);

    // Tabela de Áreas de Interesse
    await client.query(`
      CREATE TABLE IF NOT EXISTS areas_interesse (
        id SERIAL PRIMARY KEY,
        candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
        area VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índices para melhor performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_candidatos_cidade ON candidatos(cidade)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_candidatos_estado ON candidatos(estado)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_candidatos_ativo ON candidatos(ativo)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_experiencias_candidato ON experiencias(candidato_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_formacoes_candidato ON formacoes(candidato_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_habilidades_candidato ON habilidades(candidato_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_visualizacoes_empresa ON visualizacoes(empresa_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_favoritos_empresa ON favoritos(empresa_id)');

    console.log('✓ Banco de dados PostgreSQL inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  pool,
  initDatabase
};
