
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Configurações
const sqlitePath = process.env.DB_PATH || './database/emprega_lagoa.db';
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'emprega_lagoa',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

console.log('🔄 Iniciando migração SQLite → PostgreSQL...\n');

// Conectar ao SQLite
const sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao SQLite:', err.message);
    process.exit(1);
  }
  console.log('✓ Conectado ao SQLite');
});

// Conectar ao PostgreSQL
const pgPool = new Pool(pgConfig);

// Tabelas a migrar (em ordem de dependência)
const tables = [
  'empresas',
  'candidatos',
  'experiencias',
  'formacoes',
  'habilidades',
  'idiomas',
  'areas_interesse',
  'visualizacoes',
  'favoritos'
];

// Função auxiliar para obter dados do SQLite
const getSqliteData = (table) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) {
          console.log(`⚠️  Tabela ${table} não existe no SQLite (ignorando)`);
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(rows);
      }
    });
  });
};

// Função para inserir no PostgreSQL
const insertIntoPg = async (table, rows) => {
  if (rows.length === 0) {
    console.log(`  ⏭️  Nenhum dado para migrar`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const columnNames = columns.join(', ');

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const values = columns.map(col => {
      // Converter valores SQLite para PostgreSQL
      if (row[col] === null || row[col] === undefined) return null;
      
      // Converter boolean (SQLite usa 0/1, PostgreSQL usa true/false)
      if (typeof row[col] === 'number' && (col.includes('ativo') || col.includes('atual'))) {
        return row[col] === 1;
      }
      
      return row[col];
    });

    try {
      await pgPool.query(
        `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})
         ON CONFLICT DO NOTHING`,
        values
      );
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`    ❌ Erro ao inserir registro:`, error.message);
    }
  }

  console.log(`  ✓ Migrados ${successCount} registros (${errorCount} erros)`);

  // Atualizar sequência do ID (PostgreSQL SERIAL)
  if (successCount > 0) {
    try {
      await pgPool.query(`
        SELECT setval(pg_get_serial_sequence('${table}', 'id'), 
                      (SELECT MAX(id) FROM ${table}))
      `);
    } catch (error) {
      // Ignorar erro se tabela não tem coluna id
    }
  }
};

// Função principal de migração
const migrate = async () => {
  try {
    console.log('\n📊 Conectando ao PostgreSQL...');
    await pgPool.query('SELECT NOW()');
    console.log('✓ Conectado ao PostgreSQL\n');

    console.log('📋 Iniciando migração de tabelas...\n');

    for (const table of tables) {
      console.log(`📦 Migrando tabela: ${table}`);
      
      try {
        const rows = await getSqliteData(table);
        console.log(`  → Encontrados ${rows.length} registros`);
        
        if (rows.length > 0) {
          await insertIntoPg(table, rows);
        }
      } catch (error) {
        console.error(`  ❌ Erro na migração:`, error.message);
      }
      
      console.log('');
    }

    console.log('✅ Migração concluída com sucesso!\n');

    // Estatísticas finais
    console.log('📊 Estatísticas:');
    for (const table of tables) {
      try {
        const result = await pgPool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        // Ignorar
      }
    }

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
};

// Executar migração
migrate().then(() => {
  console.log('\n✨ Pronto! Agora configure DB_TYPE=postgres no .env\n');
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
