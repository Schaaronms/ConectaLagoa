// routes/dashboard.js — Todos os dados do dashboard da empresa

const express = require('express');
const router  = express.Router();
const { authMiddleware, isEmpresa } = require('../middleware/auth');
const auth = [authMiddleware, isEmpresa];
const { sql } = require('../db');

// ==============================
// GET /api/dashboard/resumo
// Cards do topo: vagas, candidaturas, contratações, taxa
// ==============================
router.get('/resumo', auth, async (req, res) => {
  const empresaId = req.user.id;  

  try {
    // Vagas ativas
    const [vagasAtivas] = await sql`
      SELECT COUNT(*) AS total FROM vagas
      WHERE empresa_id = ${empresaId} AND status = 'ativa'
    `;

    // Vagas novas esta semana
    const [vagasSemana] = await sql`
      SELECT COUNT(*) AS total FROM vagas
      WHERE empresa_id = ${empresaId}
        AND status = 'ativa'
        AND criado_em >= NOW() - INTERVAL '7 days'
    `;

    // Total de candidaturas
    const [candidaturas] = await sql`
      SELECT COUNT(*) AS total FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId}
    `;

    // Candidaturas hoje
    const [candidaturasHoje] = await sql`
      SELECT COUNT(*) AS total FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId}
        AND c.criado_em >= NOW() - INTERVAL '1 day'
    `;

    // Contratações (status = contratado)
    const [contratacoes] = await sql`
      SELECT COUNT(*) AS total FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId} AND c.status = 'contratado'
    `;

    // Contratações este mês
    const [contratacoesMes] = await sql`
      SELECT COUNT(*) AS total FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId}
        AND c.status = 'contratado'
        AND c.criado_em >= DATE_TRUNC('month', NOW())
    `;

    // Taxa de conversão (contratações / candidaturas * 100)
    const totalCandidaturas = parseInt(candidaturas.total) || 0;
    const totalContratacoes = parseInt(contratacoes.total) || 0;
    const taxa = totalCandidaturas > 0
      ? ((totalContratacoes / totalCandidaturas) * 100).toFixed(1)
      : '0.0';

    // Taxa mês anterior (para comparação)
    const [candMesAnt] = await sql`
      SELECT COUNT(*) AS total FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId}
        AND c.criado_em >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND c.criado_em <  DATE_TRUNC('month', NOW())
    `;
    const [contMesAnt] = await sql`
      SELECT COUNT(*) AS total FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId}
        AND c.status = 'contratado'
        AND c.criado_em >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND c.criado_em <  DATE_TRUNC('month', NOW())
    `;
    const taxaMesAnt = parseInt(candMesAnt.total) > 0
      ? ((parseInt(contMesAnt.total) / parseInt(candMesAnt.total)) * 100).toFixed(1)
      : '0.0';
    const difTaxa = (parseFloat(taxa) - parseFloat(taxaMesAnt)).toFixed(1);

    res.json({
      vagas_ativas:       parseInt(vagasAtivas.total),
      vagas_semana:       parseInt(vagasSemana.total),
      candidaturas:       totalCandidaturas,
      candidaturas_hoje:  parseInt(candidaturasHoje.total),
      contratacoes:       totalContratacoes,
      contratacoes_mes:   parseInt(contratacoesMes.total),
      taxa_conversao:     parseFloat(taxa),
      taxa_variacao:      parseFloat(difTaxa),
    });
  } catch (err) {
    console.error('Erro no resumo:', err);
    res.status(500).json({ erro: 'Erro ao buscar resumo.' });
  }
});

// ==============================
// GET /api/dashboard/grafico-candidaturas
// Candidaturas vs Contratações — últimos 7 meses
// ==============================
router.get('/grafico-candidaturas', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const candidaturasPorMes = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', c.criado_em), 'Mon') AS mes,
        DATE_TRUNC('month', c.criado_em) AS mes_data,
        COUNT(*) AS candidaturas,
        COUNT(*) FILTER (WHERE c.status = 'contratado') AS contratacoes
      FROM candidaturas c
      JOIN vagas v ON v.id = c.vaga_id
      WHERE v.empresa_id = ${empresaId}
        AND c.criado_em >= NOW() - INTERVAL '7 months'
      GROUP BY DATE_TRUNC('month', c.criado_em)
      ORDER BY mes_data ASC
    `;

    res.json(candidaturasPorMes.map(r => ({
      mes:          r.mes,
      candidaturas: parseInt(r.candidaturas),
      contratacoes: parseInt(r.contratacoes),
    })));
  } catch (err) {
    console.error('Erro no gráfico:', err);
    res.status(500).json({ erro: 'Erro ao buscar dados do gráfico.' });
  }
});

// ==============================
// GET /api/dashboard/vagas-por-area
// Distribuição de vagas por área (gráfico donut)
// ==============================
router.get('/vagas-por-area', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const areas = await sql`
      SELECT
        COALESCE(area, 'Outros') AS area,
        COUNT(*) AS total
      FROM vagas
      WHERE empresa_id = ${empresaId} AND status = 'ativa'
      GROUP BY area
      ORDER BY total DESC
    `;

    const totalVagas = areas.reduce((s, r) => s + parseInt(r.total), 0);

    res.json(areas.map(r => ({
      area:       r.area,
      total:      parseInt(r.total),
      percentual: totalVagas > 0 ? Math.round((parseInt(r.total) / totalVagas) * 100) : 0,
    })));
  } catch (err) {
    console.error('Erro vagas por área:', err);
    res.status(500).json({ erro: 'Erro ao buscar vagas por área.' });
  }
});

// ==============================
// GET /api/dashboard/vagas-por-mes
// Vagas publicadas por mês (bar chart)
// ==============================
router.get('/vagas-por-mes', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const dados = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', criado_em), 'Mon') AS mes,
        DATE_TRUNC('month', criado_em) AS mes_data,
        COUNT(*) AS total
      FROM vagas
      WHERE empresa_id = ${empresaId}
        AND criado_em >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', criado_em)
      ORDER BY mes_data ASC
    `;

    res.json(dados.map(r => ({
      mes:   r.mes,
      total: parseInt(r.total),
    })));
  } catch (err) {
    console.error('Erro vagas por mês:', err);
    res.status(500).json({ erro: 'Erro ao buscar vagas por mês.' });
  }
});

// ==============================
// GET /api/dashboard/candidatos-recentes
// Últimas candidaturas recebidas
// ==============================
router.get('/candidatos-recentes', auth, async (req, res) => {
  const empresaId = req.user.id;

  try {
    const candidatos = await sql`
      SELECT
        cd.id,
        cd.nome,
        cd.email,
        cd.cidade,
        cd.area,
        c.status,
        c.criado_em,
        v.titulo AS vaga_titulo
      FROM candidaturas c
      JOIN vagas v       ON v.id = c.vaga_id
      JOIN candidatos cd ON cd.id = c.candidato_id
      WHERE v.empresa_id = ${empresaId}
      ORDER BY c.criado_em DESC
      LIMIT 10
    `;

    res.json(candidatos);
  } catch (err) {
    console.error('Erro candidatos recentes:', err);
    res.status(500).json({ erro: 'Erro ao buscar candidatos recentes.' });
  }
});

module.exports = router;