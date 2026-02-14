require('dotenv').config();
const express = require('express');
const { initDatabase } = require('../config/database');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://www.conectalagoa.com.br',
    'https://conectalagoa.com.br'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
const routes = require('../routes');
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API Conecta Lagoa',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs'
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Arquivo muito grande. Tamanho máximo: 5MB' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: 'Erro no upload: ' + err.message 
    });
  }

  res.status(500).json({ 
    success: false, 
    message: err.message || 'Erro interno do servidor' 
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Rota não encontrada' 
  });
});

// Inicializar banco de dados
let isInitialized = false;
const ensureDatabase = async () => {
  if (!isInitialized) {
    await initDatabase();
    isInitialized = true;
  }
};

// Handler para Vercel
module.exports = async (req, res) => {
  await ensureDatabase();
  return app(req, res);
};

// Para desenvolvimento local
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  const startServer = async () => {
    try {
      await initDatabase();
      console.log('✓ Banco de dados inicializado');

      app.listen(PORT, () => {
        console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
        
        const conexao = process.env.DATABASE_URL ? 'NEON (nuvem)' : 'PostgreSQL LOCAL';
        console.log(`🔌 Banco: ${conexao}`);
        console.log('\n✨ Conecta Lagoa - Sistema de Recrutamento\n');
      });
        
    } catch (error) {
      console.error('Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  };

  startServer();
}