// routes/ia.js — Conecta Lagoa
// Registrar em server.js como:
//   app.use('/api/ia', require('./routes/ia'));
//
// Endpoints:
//   POST /api/ia/score                      — score IA real por candidato × vaga
//   POST /api/ia/triagem                    — triagem automática de candidatura
//   POST /api/ia/gerar-vaga                 — gerador de descrição de vaga
//   POST /api/ia/perguntas-triagem          — gera perguntas para a vaga
//   POST /api/ia/perguntas-triagem/aprovar  — empresa aprova e publica as perguntas
//   POST /api/ia/relatorio-contratacao      — gera relatório HTML de contratação

const express = require('express');
const router  = express.Router();
const { authMiddleware, isEmpresa } = require('../middleware/auth');
const {
  calcularScore,
  triagemAutomatica,
  gerarDescricaoVaga,
  gerarPerguntasTriagem,
  aprovarPerguntasTriagem,
  gerarRelatorioContratacao,
} = require('../controllers/iaController');

// Score IA — acessível por empresa (para ver ranking) e internamente (ao candidatar)
router.post('/score', authMiddleware, calcularScore);

// Triagem — empresa pode acionar manualmente; também chamada internamente
router.post('/triagem', authMiddleware, isEmpresa, triagemAutomatica);

// Gerador de vaga — só empresa
router.post('/gerar-vaga', authMiddleware, isEmpresa, gerarDescricaoVaga);

// Perguntas de triagem — só empresa
router.post('/perguntas-triagem',         authMiddleware, isEmpresa, gerarPerguntasTriagem);
router.post('/perguntas-triagem/aprovar', authMiddleware, isEmpresa, aprovarPerguntasTriagem);

// Relatório de contratação — só empresa
router.post('/relatorio-contratacao', authMiddleware, isEmpresa, gerarRelatorioContratacao);

// GET relatório existente
router.get('/relatorio-contratacao/:candidatura_id', authMiddleware, isEmpresa, async (req, res) => {
  const { pool } = require('../config/db');
  try {
    const result = await pool.query(
      `SELECT conteudo_html, gerado_em FROM relatorios_contratacao
       WHERE candidatura_id = $1 AND empresa_id = $2`,
      [req.params.candidatura_id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Relatório não encontrado' });
    res.json({ success: true, ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
