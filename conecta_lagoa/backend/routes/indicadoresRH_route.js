// ================================================================
// routes/indicadoresRH.js — Conecta Lagoa
// Adicione no seu server.js:  app.use('/api', indicadoresRHRouter);
// ================================================================
const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware de auth (reutilize o seu existente)
const authMiddleware = require('../middleware/auth'); // ajuste o caminho

// ── GET /api/empresa/indicadores-rh ──────────────────────────────
// Retorna todos os dados necessários para o painel Indicadores RH
router.get('/empresa/indicadores-rh', authMiddleware, async (req, res) => {
  const empresaId = req.user.empresa_id || req.user.id;
  const anoAtual  = new Date().getFullYear();
  const anoAnt    = anoAtual - 1;

  try {
    const client = await pool.connect();

    // 1. Headcount atual + breakdown de gênero
    const headcount = await client.query(`
      SELECT
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE genero = 'Feminino')        AS feminino,
        COUNT(*) FILTER (WHERE genero = 'Masculino')       AS masculino,
        COUNT(*) FILTER (WHERE genero NOT IN ('Feminino','Masculino') OR genero IS NULL) AS outro
      FROM colaboradores
      WHERE empresa_id = $1 AND status = 'ativo'
    `, [empresaId]);

    // 2. Admissões do ano atual vs. ano anterior
    const admissoes = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM data_admissao) = $2) AS ano_atual,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM data_admissao) = $3) AS ano_anterior
      FROM colaboradores
      WHERE empresa_id = $1
    `, [empresaId, anoAtual, anoAnt]);

    // 3. Desligamentos do ano atual vs. ano anterior
    const desligamentos = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM data_desligamento) = $2) AS ano_atual,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM data_desligamento) = $3) AS ano_anterior
      FROM colaboradores
      WHERE empresa_id = $1 AND status = 'desligado'
    `, [empresaId, anoAtual, anoAnt]);

    // 4. Turnover = desligamentos ano / headcount médio * 100
    const turnover = await client.query(`
      WITH desl AS (
        SELECT COUNT(*) AS n
        FROM colaboradores
        WHERE empresa_id = $1
          AND status = 'desligado'
          AND EXTRACT(YEAR FROM data_desligamento) = $2
      ),
      headcount_medio AS (
        SELECT COUNT(*) AS n
        FROM colaboradores
        WHERE empresa_id = $1
      )
      SELECT
        CASE WHEN hm.n = 0 THEN 0
             ELSE ROUND((d.n::NUMERIC / hm.n) * 100, 1)
        END AS pct
      FROM desl d, headcount_medio hm
    `, [empresaId, anoAtual]);

    // 5. Colaboradores por departamento (top 8)
    const porDepto = await client.query(`
      SELECT
        departamento,
        COUNT(*) AS total
      FROM colaboradores
      WHERE empresa_id = $1 AND status = 'ativo'
      GROUP BY departamento
      ORDER BY total DESC
      LIMIT 8
    `, [empresaId]);

    // 6. Evolução anual de colaboradores (últimos 10 anos)
    const evolucaoAnual = await client.query(`
      SELECT
        EXTRACT(YEAR FROM data_admissao)::INT AS ano,
        COUNT(*) AS admissoes
      FROM colaboradores
      WHERE empresa_id = $1
      GROUP BY ano
      ORDER BY ano ASC
      LIMIT 10
    `, [empresaId]);

    // 7. Colaboradores por faixa etária
    const faixaEtaria = await client.query(`
      SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 18 AND 25 THEN '18-25'
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 26 AND 35 THEN '26-35'
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 36 AND 45 THEN '36-45'
          WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 46 AND 54 THEN '46-54'
          ELSE '55+'
        END AS faixa,
        COUNT(*) AS total
      FROM colaboradores
      WHERE empresa_id = $1 AND status = 'ativo' AND data_nascimento IS NOT NULL
      GROUP BY faixa
      ORDER BY faixa ASC
    `, [empresaId]);

    client.release();

    // ── Calcula YoY (year-over-year) ──────────────────────────────
    const admAt  = parseInt(admissoes.rows[0].ano_atual)    || 0;
    const admAnt = parseInt(admissoes.rows[0].ano_anterior) || 1;
    const dslAt  = parseInt(desligamentos.rows[0].ano_atual)    || 0;
    const dslAnt = parseInt(desligamentos.rows[0].ano_anterior) || 1;

    res.json({
      headcount: {
        total:    parseInt(headcount.rows[0].total)    || 0,
        feminino: parseInt(headcount.rows[0].feminino) || 0,
        masculino:parseInt(headcount.rows[0].masculino)|| 0,
        outro:    parseInt(headcount.rows[0].outro)    || 0,
      },
      admissoes: {
        total:    admAt,
        yoy:      admAnt > 0 ? Math.round(((admAt - admAnt) / admAnt) * 100) : 0,
        yoy_up:   admAt >= admAnt,
      },
      desligamentos: {
        total:    dslAt,
        yoy:      dslAnt > 0 ? Math.round(((dslAt - dslAnt) / dslAnt) * 100) : 0,
        yoy_up:   dslAt <= dslAnt, // desligamento menor = bom
      },
      turnover: parseFloat(turnover.rows[0].pct) || 0,
      por_departamento: porDepto.rows,
      evolucao_anual:   evolucaoAnual.rows,
      faixa_etaria:     faixaEtaria.rows,
    });

  } catch (err) {
    console.error('[indicadoresRH]', err);
    res.status(500).json({ error: 'Erro ao buscar indicadores de RH' });
  }
});

module.exports = router;

// ================================================================
// No seu server.js, adicione:
//
//   const indicadoresRH = require('./routes/indicadoresRH');
//   app.use('/api', indicadoresRH);
// ================================================================
