// ================================================================
// routes/index.js — Conecta Lagoa
// FIXES:
//  1. Rotas de empresa DUPLICADAS removidas (existiam 2x após /empresa/:id)
//  2. Rotas fixas de candidato ANTES de /candidato/:id
//  3. Uploads DEPOIS do perfil fixo — evita Express capturar "curriculo" como :id
// ================================================================
const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, isEmpresa, isCandidato } = require('../middleware/auth');
const upload = require('../middleware/upload');

const authController      = require('../controllers/authController');
const candidatoController = require('../controllers/candidatoController');
const empresaController   = require('../controllers/empresaController');

// ==================== AUTENTICAÇÃO ====================
router.post('/auth/registro/candidato', authController.registroCandidato);
router.post('/auth/registro/empresa',   authController.registroEmpresa);
router.post('/auth/login',              authController.login);
router.get( '/auth/profile', authMiddleware, authController.getProfile);
router.post('/auth/esqueceu-senha',  authController.esqueceuSenha);
router.post('/auth/redefinir-senha', authController.redefinirSenha);

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
