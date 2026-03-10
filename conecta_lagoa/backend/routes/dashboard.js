// routes/dashboard.js — Dados do dashboard da empresa
const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');
const { authMiddleware, isEmpresa } = require('../middleware/auth');

const auth = [authMiddleware, isEmpresa];

// ==============================
// GET /api/dashboard/resumo
// ==============================
router.get('/resumo', auth, async (req, res) => {
  const empresaId = req.user.id;
  try {
    const [vagasAtivas, vagasSemana, candidaturas, candidaturasHoje,
           contratacoes, contratacoesMes, candMesAnt, contMesAnt] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM vagas WHERE empresa_id = $1 AND ativo = true`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM vagas WHERE empresa_id = $1 AND ativo = true AND created_at >= NOW() - INTERVAL '7 days'`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE v.empresa_id = $1`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE v.empresa_id = $1 AND c.created_at >= NOW() - INTERVAL '1 day'`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE v.empresa_id = $1 AND c.status = 'Aprovado'`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE v.empresa_id = $1 AND c.status = 'Aprovado' AND c.created_at >= DATE_TRUNC('month', NOW())`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE v.empresa_id = $1 AND c.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND c.created_at < DATE_TRUNC('month', NOW())`, [empresaId]),
      pool.query(`SELECT COUNT(*) AS total FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE v.empresa_id = $1 AND c.status = 'Aprovado' AND c.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND c.created_at < DATE_TRUNC('month', NOW())`, [empresaId]),
    ]);

    const totalCand = parseInt(candidaturas.rows[0].total) || 0;
    const totalCont = parseInt(contratacoes.rows[0].total) || 0;
    const taxa = totalCand > 0 ? ((totalCont / totalCand) * 100).toFixed(1) : '0.0';
    const candAnt = parseInt(candMesAnt.rows[0].total) || 0;
    const contAnt = parseInt(contMesAnt.rows[0].total) || 0;
    const taxaAnt = candAnt > 0 ? ((contAnt / candAnt) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      data: {
        vagas_ativas:      parseInt(vagasAtivas.rows[0].total)      || 0,
        vagas_semana:      parseInt(vagasSemana.rows[0].total)      || 0,
        candidaturas:      totalCand,
        candidaturas_hoje: parseInt(candidaturasHoje.rows[0].total) || 0,
        contratacoes:      totalCont,
        contratacoes_mes:  parseInt(contratacoesMes.rows[0].total)  || 0,
        taxa_conversao:    parseFloat(taxa),
        taxa_variacao:     parseFloat((parseFloat(taxa) - parseFloat(taxaAnt)).toFixed(1)),
      }
    });
  } catch (err) {
    console.error('Erro no resumo:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar resumo.' });
  }
});

// ==============================
// GET /api/dashboard/candidatos-recentes
// ==============================
router.get('/candidatos-recentes', auth, async (req, res) => {
  const empresaId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT cd.id, cd.nome_completo AS nome, cd.email, cd.cidade,
              c.status, c.created_at AS criado_em, v.titulo AS vaga_titulo
       FROM candidaturas c
       JOIN vagas v       ON v.id = c.vaga_id
       JOIN candidatos cd ON cd.id = c.candidato_id
       WHERE v.empresa_id = $1
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [empresaId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Erro em candidatos recentes:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos recentes.' });
  }
});

// ==============================
// GET /api/dashboard/evolucao-mensal
// ==============================
router.get('/evolucao-mensal', auth, async (req, res) => {
  const empresaId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', c.created_at), 'Mon') AS mes,
         DATE_TRUNC('month', c.created_at) AS mes_data,
         COUNT(*) AS c,
         COUNT(*) FILTER (WHERE c.status = 'Aprovado') AS h
       FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1
         AND c.created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', c.created_at)
       ORDER BY mes_data ASC`,
      [empresaId]
    );
    res.json(rows.map(r => ({ mes: r.mes, c: parseInt(r.c), h: parseInt(r.h) })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar evolução mensal.' });
  }
});

// ==============================
// GET /api/dashboard/funil
// ==============================
router.get('/funil', auth, async (req, res) => {
  const empresaId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE c.status IN ('Enviado','Visualizado'))  AS recebidos,
         COUNT(*) FILTER (WHERE c.status = 'Em Análise')                AS triados,
         COUNT(*) FILTER (WHERE c.status = 'Entrevista')                AS entrevistas,
         COUNT(*) FILTER (WHERE c.status = 'Aprovado')                  AS contratados,
         COUNT(*) FILTER (WHERE c.status = 'Reprovado')                 AS reprovados,
         COUNT(*)                                                         AS total
       FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1`,
      [empresaId]
    );
    const r = rows[0];
    const total = parseInt(r.total) || 1;
    res.json([
      { name: 'Recebidos',   count: parseInt(r.recebidos),   pct: Math.round(parseInt(r.recebidos)/total*100),   color: '#1a3a8f' },
      { name: 'Triados',     count: parseInt(r.triados),     pct: Math.round(parseInt(r.triados)/total*100),     color: '#2d52c4' },
      { name: 'Entrevistas', count: parseInt(r.entrevistas), pct: Math.round(parseInt(r.entrevistas)/total*100), color: '#e07b00' },
      { name: 'Contratados', count: parseInt(r.contratados), pct: Math.round(parseInt(r.contratados)/total*100), color: '#059669' },
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar funil.' });
  }
});

// ==============================
// GET /api/dashboard/alertas
// ==============================
router.get('/alertas', auth, async (req, res) => {
  const empresaId = req.user.id;
  try {
    const [semResposta, vagasExpirando, testesAguardando, aprovados] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM candidaturas c JOIN vagas v ON v.id=c.vaga_id WHERE v.empresa_id=$1 AND c.updated_at < NOW() - INTERVAL '7 days' AND c.status NOT IN ('Aprovado','Reprovado')`, [empresaId]),
      pool.query(`SELECT titulo FROM vagas WHERE empresa_id=$1 AND ativo=true AND prazo BETWEEN NOW() AND NOW() + INTERVAL '3 days'`, [empresaId]),
      pool.query(`SELECT COUNT(*) FROM candidaturas c JOIN vagas v ON v.id=c.vaga_id WHERE v.empresa_id=$1 AND c.status='Em Análise'`, [empresaId]),
      pool.query(`SELECT cd.nome_completo FROM candidaturas c JOIN vagas v ON v.id=c.vaga_id JOIN candidatos cd ON cd.id=c.candidato_id WHERE v.empresa_id=$1 AND c.status='Aprovado' AND c.updated_at >= NOW() - INTERVAL '1 day'`, [empresaId]),
    ]);

    const alertas = [];
    const sr = parseInt(semResposta.rows[0].count);
    if (sr > 0) alertas.push({ color:'#ef4444', msg:`${sr} candidato${sr>1?'s':''} sem resposta há +7 dias`, time:'urgente' });
    vagasExpirando.rows.forEach(v => alertas.push({ color:'#1a3a8f', msg:`Vaga "${v.titulo}" expira em breve`, time:'3 dias' }));
    const ta = parseInt(testesAguardando.rows[0].count);
    if (ta > 0) alertas.push({ color:'#e07b00', msg:`${ta} candidatura${ta>1?'s':''} aguardando análise`, time:'pendente' });
    aprovados.rows.forEach(a => alertas.push({ color:'#10b981', msg:`${a.nome_completo} foi aprovado! 🎉`, time:'hoje' }));

    res.json(alertas.slice(0, 6));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar alertas.' });
  }
});

// ==============================
// GET /api/dashboard/grafico-candidaturas (legado)
// ==============================
router.get('/grafico-candidaturas', auth, async (req, res) => {
  const empresaId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', c.created_at), 'Mon') AS mes,
              DATE_TRUNC('month', c.created_at) AS mes_data,
              COUNT(*) AS candidaturas,
              COUNT(*) FILTER (WHERE c.status = 'Aprovado') AS contratacoes
       FROM candidaturas c
       JOIN vagas v ON v.id = c.vaga_id
       WHERE v.empresa_id = $1 AND c.created_at >= NOW() - INTERVAL '7 months'
       GROUP BY DATE_TRUNC('month', c.created_at)
       ORDER BY mes_data ASC`,
      [empresaId]
    );
    res.json({ success: true, data: rows.map(r => ({ mes: r.mes, candidaturas: parseInt(r.candidaturas), contratacoes: parseInt(r.contratacoes) })) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar gráfico.' });
  }
});

module.exports = router;