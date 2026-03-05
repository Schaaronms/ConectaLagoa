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
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.path}`);
    next();
  });
}

// ==============================
// ROTAS
// ==============================
const routes      = require('./routes');
const agendaRoutes = require('./routes/agenda');
const usuariosRoutes = require('./routes/usuarios'); // ← NOVO

app.use('/api', routes);
app.use('/api/contato', require('./routes/email'));
app.use('/api/agenda', agendaRoutes);
app.use('/api/usuarios', usuariosRoutes); // ← NOVO: GET /api/usuarios/buscar-cpf/:cpf

// REMOVIDO: const { default: PanelFunil } = require('../frontend/src/pages/PanelFunil');
// ↑ isso importava React no Node — causava crash no servidor

app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API Conecta Lagoa',
    version: '1.0.0',
    endpoints: {
      health:    '/api/health',
      contato:   '/api/contato',
      dashboard: '/api/dashboard/resumo',
      vagas:     '/api/vagas',
      agenda:    '/api/agenda',
      usuarios:  '/api/usuarios',
    }
  });
});

// ==============================
// TRATAMENTO DE ERROS
// ==============================
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'Arquivo muito grande. Máximo: 5MB' });
    return res.status(400).json({ success: false, message: 'Erro no upload: ' + err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'Erro interno do servidor' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ==============================
// INICIALIZAÇÃO
// ==============================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initDatabase();
    console.log('✓ Banco de dados inicializado');
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();