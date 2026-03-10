require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const path     = require('path');

const { initDatabase } = require('./config/db');
const app = express();

// ================================================================
// SEGURANÇA — HEADERS HTTP (helmet)
// Adiciona ~12 headers de segurança automaticamente:
// X-Frame-Options, X-Content-Type-Options, HSTS, CSP, etc.
// ================================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite servir /uploads
}));

// ================================================================
// CORS — whitelist explícita
// ================================================================
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://www.conectalagoa.com.br',
  'https://conectalagoa.com.br',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (Postman, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ================================================================
// BODY PARSING — com limite para evitar DoS
// ================================================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ================================================================
// RATE LIMITING
// ================================================================

// Limite geral: 200 req / 15 min por IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api', globalLimiter);

// Limite de auth: 10 tentativas / 15 min por IP (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  skipSuccessfulRequests: true, // só conta falhas
});
app.use('/api/auth/login',              authLimiter);
app.use('/api/auth/registro/candidato', authLimiter);
app.use('/api/auth/registro/empresa',   authLimiter);
app.use('/api/auth/esqueceu-senha',     authLimiter);

// ================================================================
// UPLOADS ESTÁTICOS
// ================================================================
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// ================================================================
// LOG — apenas em desenvolvimento
// ================================================================
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${req.method} ${req.path}`);
    next();
  });
}

// ================================================================
// ROTAS
// ================================================================
const routes               = require('./routes');
const indicadoresRHRouter  = require('./routes/indicadoresRH_route');
const colaboradoresRouter  = require('./routes/colaboradores_route');
const avaliacoesCargosRouter = require('./routes/avaliacoesCargos_route');
const agendaRoutes         = require('./routes/agenda');
const usuariosRoutes       = require('./routes/usuarios');
const vagasRoutes          = require('./routes/vagas');

app.use('/api', indicadoresRHRouter);
app.use('/api', colaboradoresRouter);
app.use('/api', avaliacoesCargosRouter);
app.use('/api/vagas',    vagasRoutes);
app.use('/api/agenda',   agendaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/contato',  require('./routes/email'));
app.use('/api/talentos', require('./routes/talentos'));
// IA & Features Estratégicas
app.use('/api/ia', require('./routes/ia'));
app.use('/api', routes); // deve vir por último

// ================================================================
// HEALTH CHECK público (sem auth, sem rate limit)
// ================================================================
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API Conecta Lagoa',
    version: '1.0.0',
    status: 'online',
  });
});

// ================================================================
// TRATAMENTO DE ERROS
// ================================================================
app.use((err, req, res, next) => {
  // Erro de CORS
  if (err.message?.startsWith('CORS bloqueado')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  // Erro de upload (Multer)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'Arquivo muito grande. Máximo: 5MB' });
    return res.status(400).json({ success: false, message: 'Erro no upload: ' + err.message });
  }
  // Erro genérico — nunca vaza stack em produção
  console.error('[ERROR]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  const msg    = process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : (err.message || 'Erro interno');
  res.status(status).json({ success: false, message: msg });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ================================================================
// INICIALIZAÇÃO
// ================================================================
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