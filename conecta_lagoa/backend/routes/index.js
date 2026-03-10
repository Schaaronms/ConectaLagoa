// ================================================================
// routes/index.js — Conecta Lagoa
// FIXES:
//  1. Rotas de empresa DUPLICADAS removidas (existiam 2x após /empresa/:id)
//  2. Rotas fixas de candidato ANTES de /candidato/:id
//  3. Uploads DEPOIS do perfil fixo — evita Express capturar "curriculo" como :id
//  4. check-email adicionado (validação no cadastro)
//  5. Google OAuth adicionado (passport-google-oauth20)
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

// Carrega a configuração do Passport (estratégia Google)
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
// 1. Inicia o fluxo — redireciona para o Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// 2. Callback — Google redireciona de volta aqui
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google` }),
  (req, res) => {
    // req.user foi preenchido pela estratégia do Passport
    const token = jwt.sign(
      { id: req.user.id, tipo: req.user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redireciona pro frontend com o token na URL
    // O AuthCallback.jsx vai capturar e salvar no contexto
    const destino = req.user.tipo === 'empresa'
      ? '/empresa/dashboard'
      : '/candidato/dashboard';

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&destino=${destino}`);
  }
);

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
router.put(  '/empresa/perfil',       authMiddleware, isEmpresa, empresaController.atualizarPerfil);
router.post( '/empresa/logo',         authMiddleware, isEmpresa, upload.single('logo'), empresaController.uploadLogo);
router.get(  '/empresa/meu-perfil',   authMiddleware, isEmpresa, empresaController.getMeuPerfil);
router.get(  '/empresa/vagas',        authMiddleware, isEmpresa, empresaController.listarVagas);
router.post( '/empresa/vagas',        authMiddleware, isEmpresa, empresaController.criarVaga);
router.put(  '/empresa/vagas/:vagaId',    authMiddleware, isEmpresa, empresaController.atualizarVaga);
router.delete('/empresa/vagas/:vagaId',   authMiddleware, isEmpresa, empresaController.excluirVaga);

router.post(  '/empresa/visualizar/:candidatoId',  authMiddleware, isEmpresa, empresaController.visualizarCandidato);
router.post(  '/empresa/favorito/:candidatoId',    authMiddleware, isEmpresa, empresaController.adicionarFavorito);
router.delete('/empresa/favorito/:candidatoId',    authMiddleware, isEmpresa, empresaController.removerFavorito);
router.get(   '/empresa/favoritos',                authMiddleware, isEmpresa, empresaController.listarFavoritos);
router.get(   '/empresa/historico-visualizacoes',  authMiddleware, isEmpresa, empresaController.historicoVisualizacoes);
router.get(   '/empresa/estatisticas',             authMiddleware, isEmpresa, empresaController.getEstatisticas);
router.get(   '/empresa/candidatos-vagas',         authMiddleware, isEmpresa, empresaController.candidatosPorVaga);
router.get(   '/empresa/candidatos-ativos',        authMiddleware, isEmpresa, empresaController.candidatosAtivos);
router.get(   '/empresa/candidatos-contratados',   authMiddleware, isEmpresa, empresaController.candidatosContratados);

// ⚠️ Rota dinâmica SEMPRE por último!
router.get('/empresa/:id', authMiddleware, empresaController.getPerfilPorId);

// ==================== RANKING IA ====================
const rankingIARoutes = require('./rankingIA');
router.use('/ranking-ia', rankingIARoutes);

// ==================== DASHBOARD ====================
const dashboardRoutes = require('./dashboard');
router.use('/dashboard', dashboardRoutes);

// ==================== HEALTH CHECK ====================
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Conecta Lagoa rodando normalmente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;