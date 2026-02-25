const express = require('express');
const router = express.Router();

const { authMiddleware, isEmpresa, isCandidato } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Controllers
const authController = require('../controllers/authController');
const candidatoController = require('../controllers/candidatoController');
const empresaController = require('../controllers/empresaController');

// ==================== AUTENTICAÇÃO ====================
router.post('/auth/registro/candidato', authController.registroCandidato);
router.post('/auth/registro/empresa',   authController.registroEmpresa);
router.post('/auth/login',              authController.login);
router.get( '/auth/profile', authMiddleware, authController.getProfile);

// Recuperação de senha
router.post('/auth/esqueceu-senha',  authController.esqueceuSenha);
router.post('/auth/redefinir-senha', authController.redefinirSenha);

// ==================== CANDIDATOS ====================
// Perfil próprio
router.get( '/candidato/meu-perfil', authMiddleware, isCandidato, candidatoController.getMeuPerfil);
router.put('/candidato/perfil',      authMiddleware, isCandidato, candidatoController.atualizarPerfil);

// Perfil público (visualizado por empresas)
router.get('/candidato/:id', authMiddleware, candidatoController.getPerfilPorId);

// Uploads
router.post('/candidato/curriculo', authMiddleware, isCandidato, upload.single('curriculo'), candidatoController.uploadCurriculo);
router.post('/candidato/foto',      authMiddleware, isCandidato, upload.single('foto'),      candidatoController.uploadFoto);

// Dados complementares
router.post('/candidato/experiencia', authMiddleware, isCandidato, candidatoController.adicionarExperiencia);
router.post('/candidato/formacao',    authMiddleware, isCandidato, candidatoController.adicionarFormacao);
router.post('/candidato/habilidade',  authMiddleware, isCandidato, candidatoController.adicionarHabilidade);

// Busca (para empresas)
router.get('/candidatos', authMiddleware, isEmpresa, candidatoController.buscarCandidatos);

// ==================== EMPRESAS ====================
// Perfil
router.put('/empresa/perfil', authMiddleware, isEmpresa, empresaController.atualizarPerfil);
router.post('/empresa/logo',  authMiddleware, isEmpresa, upload.single('logo'), empresaController.uploadLogo);
router.get('/empresa/meu-perfil', authMiddleware, isEmpresa, empresaController.getMeuPerfil);
router.get('/empresa/vagas', authMiddleware, isEmpresa, empresaController.listarVagas);
router.post('/empresa/vagas', authMiddleware, isEmpresa, empresaController.criarVaga);
router.put('/empresa/vagas/:vagaId', authMiddleware, isEmpresa, empresaController.atualizarVaga);
router.delete('/empresa/vagas/:vagaId', authMiddleware, isEmpresa, empresaController.excluirVaga);
router.get('/empresa/:id', authMiddleware, empresaController.getPerfilPorId);

// Interações com candidatos
router.post(  '/empresa/visualizar/:candidatoId', authMiddleware, isEmpresa, empresaController.visualizarCandidato);
router.post(  '/empresa/favorito/:candidatoId',   authMiddleware, isEmpresa, empresaController.adicionarFavorito);
router.delete('/empresa/favorito/:candidatoId',   authMiddleware, isEmpresa, empresaController.removerFavorito);
router.get(   '/empresa/favoritos',               authMiddleware, isEmpresa, empresaController.listarFavoritos);
router.get(   '/empresa/historico-visualizacoes', authMiddleware, isEmpresa, empresaController.historicoVisualizacoes);
router.get(   '/empresa/estatisticas',            authMiddleware, isEmpresa, empresaController.getEstatisticas);
router.get(   '/empresa/candidatos-vagas',        authMiddleware, isEmpresa, empresaController.candidatosPorVaga);
router.get(   '/empresa/candidatos-ativos',       authMiddleware, isEmpresa, empresaController.candidatosAtivos);
router.get(   '/empresa/candidatos-contratados',  authMiddleware, isEmpresa, empresaController.candidatosContratados);



// ==================== DASHBOARD ====================
const dashboardRoutes = require('./dashboard');
router.use('/dashboard', dashboardRoutes);

// ==================== HEALTH CHECK ====================
router.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API Conecta Lagoa rodando normalmente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;