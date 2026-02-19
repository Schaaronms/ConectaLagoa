const express = require('express');
const router = express.Router();
const { authMiddleware, isEmpresa, isCandidato } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Controllers
const authController = require('../controllers/authController');
const candidatoController = require('../controllers/candidatoController');
const empresaController = require('../controllers/empresaController');

// ==================== ROTAS DE AUTENTICAÇÃO ====================
router.post('/auth/registro/candidato', authController.registroCandidato);
router.post('/auth/registro/empresa', authController.registroEmpresa);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authMiddleware, authController.getProfile);

// ==================== ROTAS DE CANDIDATOS ====================
// Perfil
router.put('/candidato/perfil', authMiddleware, isCandidato, candidatoController.atualizarPerfil);
router.get('/candidato/perfil', authMiddleware, isCandidato, candidatoController.getPerfilCompleto);
router.get('/candidato/:id', authMiddleware, candidatoController.getPerfilCompleto);

// Uploads
router.post('/candidato/curriculo', authMiddleware, isCandidato, upload.single('curriculo'), candidatoController.uploadCurriculo);
router.post('/candidato/foto', authMiddleware, isCandidato, upload.single('foto'), candidatoController.uploadFoto);

// Experiências e formação
router.post('/candidato/experiencia', authMiddleware, isCandidato, candidatoController.adicionarExperiencia);
router.post('/candidato/formacao', authMiddleware, isCandidato, candidatoController.adicionarFormacao);
router.post('/candidato/habilidade', authMiddleware, isCandidato, candidatoController.adicionarHabilidade);

// Busca de candidatos (para empresas)
router.get('/candidatos', authMiddleware, isEmpresa, candidatoController.buscarCandidatos);

// ==================== ROTAS DE EMPRESAS ====================
// Perfil
router.put('/empresa/perfil', authMiddleware, isEmpresa, empresaController.atualizarPerfil);
router.post('/empresa/logo', authMiddleware, isEmpresa, upload.single('logo'), empresaController.uploadLogo);

// Visualizações e favoritos
router.post('/empresa/visualizar/:candidatoId', authMiddleware, isEmpresa, empresaController.visualizarCandidato);
router.post('/empresa/favorito/:candidatoId', authMiddleware, isEmpresa, empresaController.adicionarFavorito);
router.delete('/empresa/favorito/:candidatoId', authMiddleware, isEmpresa, empresaController.removerFavorito);
router.get('/empresa/favoritos', authMiddleware, isEmpresa, empresaController.listarFavoritos);
router.get('/empresa/historico', authMiddleware, isEmpresa, empresaController.historicoVisualizacoes);
router.get('/empresa/estatisticas', authMiddleware, isEmpresa, empresaController.getEstatisticas);

// ==================== ROTA RECUPERAÇÃO SENHA EMAIL ====================
router.post('/auth/esqueceu-senha', authController.esqueceuSenha);
router.post('/auth/redefinir-senha', authController.redefinirSenha);


// ==================== ROTA DE SAÚDE ====================
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Emprega Lagoa funcionando!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
