// ================================================================
// routes/index.js — Conecta Lagoa
// FIXES:
//  1. Guard Google OAuth — servidor sobe mesmo sem as variáveis
//  2. Rotas de empresa DUPLICADAS removidas
//  3. Rotas fixas de candidato ANTES de /candidato/:id
//  4. Uploads DEPOIS do perfil fixo
//  5. check-email adicionado
// ================================================================
const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authMiddleware, isEmpresa, isCandidato } = require('../middleware/auth');
const upload = require('../middleware/upload');

const authController      = require('../controllers/authController');
const candidatoController = require('../controllers/candidatoController');
const empresaController   = require('../controllers/empresaController');

// Carrega a configuração do Passport (estratégia Google — com guard interno)
require('../config/passport');

// ==================== AUTENTICAÇÃO ====================
router.post('/auth/registro/candidato', authController.registroCandidato);
router.post('/auth/registro/empresa',   authController.registroEmpresa);
router.post('/auth/login',              authController.login);
router.get( '/auth/profile', authMiddleware, authController.getProfile);
router.post('/auth/esqueceu-senha',  authController.esqueceuSenha);
router.post('/auth/redefinir-senha', authController.redefinirSenha);

// ── Verifica se e-mail já existe (usado no onBlur do cadastro) ──
router.get('/auth/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ exists: false });
  try {
    const result = await pool.query(
      `SELECT id FROM candidatos WHERE email = $1
       UNION
       SELECT id FROM empresas    WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('[check-email]', err.message);
    res.status(500).json({ exists: false });
  }
});

// ── Google OAuth ──────────────────────────────────────────────
// Guard: só registra as rotas reais se as variáveis existirem.
// Sem elas o servidor sobe normalmente — OAuth fica desativado.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {

  // 1. Inicia o fluxo — redireciona para o Google
  router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  // 2. Callback — Google redireciona de volta aqui
  router.get('/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`,
    }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user.id, tipo: req.user.tipo },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      const destino = req.user.tipo === 'empresa'
        ? '/empresa/dashboard'
        : '/candidato/dashboard';
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&destino=${destino}`
      );
    }
  );

  console.log('✓ Rotas Google OAuth ativas');

} else {
  // Fallback: rotas existem mas retornam 503 sem quebrar o servidor
  router.get('/auth/google', (_req, res) => {
    res.status(503).json({ error: 'Login com Google não configurado neste ambiente' });
  });
  router.get('/auth/google/callback', (_req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_not_configured`);
  });
  console.warn('⚠️  Google OAuth desativado — GOOGLE_CLIENT_ID/SECRET ausentes');
}

// ==================== AGENDA ====================
const agendaRoutes = require('./agenda');
router.use('/agenda', agendaRoutes);

// ==================== CANDIDATOS ====================
// ⚠️ Rotas FIXAS antes de /:id — senão Express captura "meu-perfil" como ID
router.get( '/candidato/meu-perfil',  authMiddleware, isCandidato, candidatoController.getMeuPerfil);
router.put( '/candidato/perfil',      authMiddleware, isCandidato, candidatoController.atualizarPerfil);
router.post('/candidato/curriculo',   authMiddleware, isCandidato, upload.single('curriculo'), candidatoController.uploadCurriculo);
router.post('/candidato/foto',        authMiddleware, isCandidato, upload.single('foto'),      candidatoController.uploadFoto);
router.post('/candidato/experiencia', authMiddleware, isCandidato, candidatoController.adicionarExperiencia);
router.post('/candidato/formacao',    authMiddleware, isCandidato, candidatoController.adicionarFormacao);
router.post('/candidato/habilidade',  authMiddleware, isCandidato, candidatoController.adicionarHabilidade);

// Perfil público — por último pois tem :id
router.get('/candidato/:id', authMiddleware, candidatoController.getPerfilPorId);

// Busca (para empresas)
router.get('/candidatos', authMiddleware, isEmpresa, candidatoController.buscarCandidatos);

// ==================== EMPRESAS ====================
// ⚠️ Rotas FIXAS antes de /empresa/:id
router.put(  '/empresa/perfil',     authMiddleware, isEmpresa, empresaController.atualizarPerfil);
router.post( '/empresa/logo',       authMiddleware, isEmpresa, upload.single('logo'), empresaController.uploadLogo);
router.get(  '/empresa/meu-perfil', authMiddleware, isEmpresa, empresaController.getMeuPerfil);
router.get(  '/empresa/vagas',      authMiddleware, isEmpresa, empresaController.listarVagas);
router.post( '/empresa/vagas',      authMiddleware, isEmpresa, empresaController.criarVaga);
router.put(  '/empresa/vagas/:vagaId',    authMiddleware, isEmpresa, empresaController.atualizarVaga);
router.delete('/empresa/vagas/:vagaId',   authMiddleware, isEmpresa, empresaController.excluirVaga);

router.post(  '/empresa/visualizar/:candidatoId', authMiddleware, isEmpresa, empresaController.visualizarCandidato);
router.post(  '/empresa/favorito/:candidatoId',   authMiddleware, isEmpresa, empresaController.adicionarFavorito);
router.delete('/empresa/favorito/:candidatoId',   authMiddleware, isEmpresa, empresaController.removerFavorito);
router.get(   '/empresa/favoritos',               authMiddleware, isEmpresa, empresaController.listarFavoritos);
router.get(   '/empresa/historico-visualizacoes', authMiddleware, isEmpresa, empresaController.historicoVisualizacoes);
router.get(   '/empresa/estatisticas',            authMiddleware, isEmpresa, empresaController.getEstatisticas);
router.get(   '/empresa/candidatos-vagas',        authMiddleware, isEmpresa, empresaController.candidatosPorVaga);
router.get(   '/empresa/candidatos-ativos',       authMiddleware, isEmpresa, empresaController.candidatosAtivos);
router.get(   '/empresa/candidatos-contratados',  authMiddleware, isEmpresa, empresaController.candidatosContratados);

// ⚠️ Rota dinâmica SEMPRE por último!
router.get('/empresa/:id', authMiddleware, empresaController.getPerfilPorId);

// ==================== RANKING IA ====================
const rankingIARoutes = require('./rankingIA');
router.use('/ranking-ia', rankingIARoutes);

// ==================== DASHBOARD ====================
const dashboardRoutes = require('./dashboard');
router.use('/dashboard', dashboardRoutes);

// ==================== HEALTH CHECK ====================
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Conecta Lagoa rodando normalmente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;