// routes/dashboard.js — Dados do dashboard da empresa
// Usa o padrão db.query / pool do config/database.js

const express = require('express');
const router  = express.Router();
const { db }  = require('../config/database');
const { authMiddleware, isEmpresa } = require('../middleware/auth');


const auth = [authMiddleware, isEmpresa];

// ==============================
// GET /api/dashboard/resumo
// ==============================
router.get('/resumo', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const vagasAtivas = await db.get(
      `SELECT COUNT(*) AS total FROM vagas
       WHERE empresa_id = $1 AND status = 'ativa'`,
      [empresaId]
    );

    const vagasSemana = await db.get(
      `SELECT COUNT(*) AS total FROM vagas
       WHERE empresa_id = $1 AND status = 'ativa'
         AND data_publicacao >= NOW() - INTERVAL '7 days'`,
      [empresaId]
    );

    const candidaturas = await db.get(
      `SELECT COUNT(*) AS total FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1`,
      [empresaId]
    );

    const candidaturasHoje = await db.get(
      `SELECT COUNT(*) AS total FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1
         AND c.data_candidatura >= NOW() - INTERVAL '1 day'`,
      [empresaId]
    );

    const contratacoes = await db.get(
      `SELECT COUNT(*) AS total FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1 AND c.status = 'contratado'`,
      [empresaId]
    );

    const contratacoesMes = await db.get(
      `SELECT COUNT(*) AS total FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1
         AND c.status = 'contratado'
         AND c.data_candidatura >= DATE_TRUNC('month', NOW())`,
      [empresaId]
    );

    const totalCandidaturas = parseInt(candidaturas?.total)  || 0;
    const totalContratacoes = parseInt(contratacoes?.total)  || 0;
    const taxa = totalCandidaturas > 0
      ? ((totalContratacoes / totalCandidaturas) * 100).toFixed(1)
      : '0.0';

    const candMesAnt = await db.get(
      `SELECT COUNT(*) AS total FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1
         AND c.data_candidatura >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
         AND c.data_candidatura <  DATE_TRUNC('month', NOW())`,
      [empresaId]
    );
    const contMesAnt = await db.get(
      `SELECT COUNT(*) AS total FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1
         AND c.status = 'contratado'
         AND c.data_candidatura >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
         AND c.data_candidatura <  DATE_TRUNC('month', NOW())`,
      [empresaId]
    );

    const taxaMesAnt = parseInt(candMesAnt?.total) > 0
      ? ((parseInt(contMesAnt?.total) / parseInt(candMesAnt?.total)) * 100).toFixed(1)
      : '0.0';

    res.json({
      success: true,
      data: {
        vagas_ativas:      parseInt(vagasAtivas?.total)      || 0,
        vagas_semana:      parseInt(vagasSemana?.total)      || 0,
        candidaturas:      totalCandidaturas,
        candidaturas_hoje: parseInt(candidaturasHoje?.total) || 0,
        contratacoes:      totalContratacoes,
        contratacoes_mes:  parseInt(contratacoesMes?.total)  || 0,
        taxa_conversao:    parseFloat(taxa),
        taxa_variacao:     parseFloat((parseFloat(taxa) - parseFloat(taxaMesAnt)).toFixed(1)),
      }
    });

  } catch (err) {
    console.error('Erro no resumo do dashboard:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar resumo.' });
  }
});

// ==============================
// GET /api/dashboard/grafico-candidaturas
// ==============================
router.get('/grafico-candidaturas', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const dados = await db.all(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', c.data_candidatura), 'Mon') AS mes,
         DATE_TRUNC('month', c.data_candidatura) AS mes_data,
         COUNT(*) AS candidaturas,
         COUNT(*) FILTER (WHERE c.status = 'contratado') AS contratacoes
       FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1
         AND c.data_candidatura >= NOW() - INTERVAL '7 months'
       GROUP BY DATE_TRUNC('month', c.data_candidatura)
       ORDER BY mes_data ASC`,
      [empresaId]
    );

    res.json({
      success: true,
      data: dados.map(r => ({
        mes:          r.mes,
        candidaturas: parseInt(r.candidaturas),
        contratacoes: parseInt(r.contratacoes),
      }))
    });

  } catch (err) {
    console.error('Erro no gráfico de candidaturas:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar gráfico.' });
  }
});

// ==============================
// GET /api/dashboard/vagas-por-area
// ==============================
router.get('/vagas-por-area', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const areas = await db.all(
      `SELECT
         COALESCE(area, 'Outros') AS area,
         COUNT(*) AS total
       FROM vagas
       WHERE empresa_id = $1 AND status = 'ativa'
       GROUP BY area
       ORDER BY total DESC`,
      [empresaId]
    );

    const totalVagas = areas.reduce((s, r) => s + parseInt(r.total), 0);

    res.json({
      success: true,
      data: areas.map(r => ({
        area:       r.area,
        total:      parseInt(r.total),
        percentual: totalVagas > 0
          ? Math.round((parseInt(r.total) / totalVagas) * 100)
          : 0,
      }))
    });

  } catch (err) {
    console.error('Erro em vagas por área:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar vagas por área.' });
  }
});

// ==============================
// GET /api/dashboard/vagas-por-mes
// ==============================
router.get('/vagas-por-mes', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const dados = await db.all(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', data_publicacao), 'Mon') AS mes,
         DATE_TRUNC('month', data_publicacao) AS mes_data,
         COUNT(*) AS total
       FROM vagas
       WHERE empresa_id = $1
         AND data_publicacao >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', data_publicacao)
       ORDER BY mes_data ASC`,
      [empresaId]
    );

    res.json({
      success: true,
      data: dados.map(r => ({
        mes:   r.mes,
        total: parseInt(r.total),
      }))
    });

  } catch (err) {
    console.error('Erro em vagas por mês:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar vagas por mês.' });
  }
});

// ==============================
// GET /api/dashboard/candidatos-recentes
// ==============================
router.get('/candidatos-recentes', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const candidatos = await db.all(
      `SELECT
         cd.id,
         cd.nome_completo AS nome,
         cd.email,
         cd.cidade,
         c.status,
         c.data_candidatura AS criado_em,
         v.titulo         AS vaga_titulo
       FROM candidaturas c
       JOIN vagas v       ON v.id = c.vaga_id
       JOIN candidatos cd ON cd.id = c.candidato_id
       WHERE v.empresa_id = $1
       ORDER BY c.data_candidatura DESC
       LIMIT 10`,
      [empresaId]
    );

    res.json({ success: true, data: candidatos });

  } catch (err) {
    console.error('Erro em candidatos recentes:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos recentes.' });
  }
});

module.exports = router;