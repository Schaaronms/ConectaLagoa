require('dotenv').config();
const express = require('express');
const { initDatabase } = require('./config/database');
const cors = require('cors');
const path = require('path');

const app = express();

// ==============================
// MIDDLEWARES
// ==============================
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
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Log de requisições (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.path}`);
    next();
  });
}

// ==============================
// ROTAS
// ==============================

// Suas rotas originais
const routes = require('./routes');
app.use('/api', routes);

// Rotas novas adicionadas
app.use('/api/contato',   require('./routes/email'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API Conecta Lagoa',
    version: '1.0.0',
    endpoints: {
      health:     '/api/health',
      contato:    '/api/contato',
      dashboard:  '/api/dashboard/resumo',
    }
  });
});

// ==============================
// TRATAMENTO DE ERROS
// ==============================
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

// ==============================
// INICIALIZAÇÃO DO BANCO
// ==============================
let isInitialized = false;
const ensureDatabase = async () => {
  if (!isInitialized) {
    await initDatabase();
    isInitialized = true;
  }
};


// ==============================
// DESENVOLVIMENTO LOCAL
// ==============================
// Substitui o if (require.main === module) por isso:
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    console.log('✓ Banco de dados inicializado');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();