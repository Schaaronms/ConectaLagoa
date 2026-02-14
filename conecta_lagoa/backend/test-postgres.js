#!/usr/bin/env node

/**
 * Teste de Conexão PostgreSQL
 * Execute: node test-postgres.js
 */

require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testando conexão com PostgreSQL...\n');

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

console.log('📋 Configuração:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User: ${config.user}`);
console.log(`   Password: ${config.password ? '***' : '(não definida)'}\n`);

const pool = new Pool(config);

async function test() {
  try {
    console.log('⏳ Tentando conectar...');
    
    const client = await pool.connect();
    console.log('✅ Conectado com sucesso!\n');
    
    // Testar query
    console.log('⏳ Testando query...');
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.log('✅ Query executada com sucesso!\n');
    
    console.log('📊 Informações do servidor:');
    console.log(`   Hora: ${result.rows[0].now}`);
    console.log(`   Versão: ${result.rows[0].version}\n`);
    
    // Listar tabelas
    console.log('⏳ Listando tabelas...');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    if (tables.rows.length > 0) {
      console.log('✅ Tabelas encontradas:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada (execute o servidor para criar as tabelas)');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✨ Teste concluído com sucesso!');
    console.log('💡 Seu PostgreSQL está funcionando perfeitamente!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro na conexão:\n');
    console.error(error.message);
    console.error('\n💡 Verifique:');
    console.error('   1. PostgreSQL está rodando?');
    console.error('   2. Credenciais no .env estão corretas?');
    console.error('   3. Banco de dados existe?');
    console.error(`      → createdb -U ${config.user} ${config.database}\n`);
    
    await pool.end();
    process.exit(1);
  }
}

test();
