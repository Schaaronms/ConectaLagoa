// ================================================================
// routes/avaliacoesCargos.js — Conecta Lagoa
//
// No server.js adicione:
//   const avaliacoesCargos = require('./routes/avaliacoesCargos');
//   app.use('/api', avaliacoesCargos);
// ================================================================
const express  = require('express');
const router   = express.Router();
const { Pool } = require('pg');
const pool     = new Pool({ connectionString: process.env.DATABASE_URL });
const auth     = require('../middleware/auth');
const getEmpId = (req) => req.user.empresa_id || req.user.id;

// ════════════════════════════════════════════════════════════════
// AVALIAÇÕES
// ════════════════════════════════════════════════════════════════

// GET /api/avaliacoes?colaborador_id=X
router.get('/avaliacoes', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  const { colaborador_id } = req.query;
  try {
    const where  = ['a.empresa_id = $1'];
    const params = [empresaId];
    if (colaborador_id) { params.push(colaborador_id); where.push(`a.colaborador_id = $${params.length}`); }

    const { rows } = await pool.query(`
      SELECT a.*, c.nome AS colaborador_nome
      FROM avaliacoes a
      JOIN colaboradores c ON c.id = a.colaborador_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro ao buscar avaliações' }); }
});

// GET /api/avaliacoes/media-equipe — média de todas as competências
router.get('/avaliacoes/media-equipe', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  try {
    const { rows } = await pool.query(`
      SELECT
        ROUND(AVG(comunicacao),1)     AS comunicacao,
        ROUND(AVG(trabalho_equipe),1) AS trabalho_equipe,
        ROUND(AVG(iniciativa),1)      AS iniciativa,
        ROUND(AVG(lideranca),1)       AS lideranca,
        ROUND(AVG(organizacao),1)     AS organizacao,
        ROUND(AVG(nota_geral),1)      AS nota_geral,
        COUNT(*)                      AS total_avaliacoes
      FROM avaliacoes
      WHERE empresa_id = $1
    `, [empresaId]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao calcular médias' }); }
});

// POST /api/avaliacoes
router.post('/avaliacoes', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  const { colaborador_id, periodo, avaliador_nome,
          comunicacao, trabalho_equipe, iniciativa, lideranca, organizacao, observacao } = req.body;

  if (!colaborador_id) return res.status(400).json({ error: 'colaborador_id obrigatório' });
  if (!periodo)        return res.status(400).json({ error: 'periodo obrigatório' });

  // Calcula nota geral automaticamente (média das 5 competências)
  const vals = [comunicacao, trabalho_equipe, iniciativa, lideranca, organizacao].map(Number).filter(v => !isNaN(v));
  const nota_geral = vals.length > 0 ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : null;

  try {
    const { rows } = await pool.query(`
      INSERT INTO avaliacoes
        (empresa_id, colaborador_id, periodo, avaliador_nome,
         comunicacao, trabalho_equipe, iniciativa, lideranca, organizacao, nota_geral, observacao)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [empresaId, colaborador_id, periodo, avaliador_nome || null,
        comunicacao || null, trabalho_equipe || null, iniciativa || null,
        lideranca || null, organizacao || null, nota_geral, observacao || null]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao salvar avaliação' }); }
});

// DELETE /api/avaliacoes/:id
router.delete('/avaliacoes/:id', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  try {
    await pool.query('DELETE FROM avaliacoes WHERE id=$1 AND empresa_id=$2', [req.params.id, empresaId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Erro ao deletar' }); }
});

// ════════════════════════════════════════════════════════════════
// CARGOS E SALÁRIOS
// ════════════════════════════════════════════════════════════════

// GET /api/cargos
router.get('/cargos', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        COUNT(col.id) AS total_colaboradores
      FROM cargos c
      LEFT JOIN colaboradores col ON col.cargo_id = c.id AND col.status = 'ativo'
      WHERE c.empresa_id = $1
      GROUP BY c.id
      ORDER BY c.departamento, c.nome
    `, [empresaId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro ao buscar cargos' }); }
});

// POST /api/cargos
router.post('/cargos', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  const { nome, departamento, faixa_i, faixa_ii, faixa_iii, faixa_iv, faixa_v } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome do cargo obrigatório' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO cargos (empresa_id, nome, departamento, faixa_i, faixa_ii, faixa_iii, faixa_iv, faixa_v)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [empresaId, nome, departamento || null,
        faixa_i||null, faixa_ii||null, faixa_iii||null, faixa_iv||null, faixa_v||null]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao criar cargo' }); }
});

// PUT /api/cargos/:id
router.put('/cargos/:id', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  const { nome, departamento, faixa_i, faixa_ii, faixa_iii, faixa_iv, faixa_v } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE cargos SET nome=$1, departamento=$2,
        faixa_i=$3, faixa_ii=$4, faixa_iii=$5, faixa_iv=$6, faixa_v=$7, updated_at=NOW()
      WHERE id=$8 AND empresa_id=$9 RETURNING *
    `, [nome, departamento||null, faixa_i||null, faixa_ii||null, faixa_iii||null,
        faixa_iv||null, faixa_v||null, req.params.id, empresaId]);
    if (!rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao atualizar cargo' }); }
});

// DELETE /api/cargos/:id
router.delete('/cargos/:id', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  try {
    await pool.query('DELETE FROM cargos WHERE id=$1 AND empresa_id=$2', [req.params.id, empresaId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Erro ao deletar cargo' }); }
});

// PATCH /api/colaboradores/:id/cargo — vincula colaborador a cargo/faixa
router.patch('/colaboradores/:id/cargo', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  const { cargo_id, faixa_atual } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE colaboradores SET cargo_id=$1, faixa_atual=$2, updated_at=NOW()
      WHERE id=$3 AND empresa_id=$4 RETURNING *
    `, [cargo_id || null, faixa_atual || null, req.params.id, empresaId]);
    if (!rows[0]) return res.status(404).json({ error: 'Colaborador não encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro ao vincular cargo' }); }
});

// GET /api/cargos/aderencia — relatório de aderência salarial
// Compara salário atual do colaborador com a faixa do cargo dele
router.get('/cargos/aderencia', auth, async (req, res) => {
  const empresaId = getEmpId(req);
  try {
    const { rows } = await pool.query(`
      SELECT
        col.id, col.nome, col.cargo AS cargo_texto, col.faixa_atual,
        col.salario AS salario_atual,
        cg.nome AS cargo_nome,
        cg.faixa_i, cg.faixa_ii, cg.faixa_iii, cg.faixa_iv, cg.faixa_v,
        CASE col.faixa_atual
          WHEN 'I'   THEN cg.faixa_i
          WHEN 'II'  THEN cg.faixa_ii
          WHEN 'III' THEN cg.faixa_iii
          WHEN 'IV'  THEN cg.faixa_iv
          WHEN 'V'   THEN cg.faixa_v
          ELSE NULL
        END AS salario_referencia,
        CASE
          WHEN col.salario IS NULL OR cg.id IS NULL THEN 'sem_dados'
          WHEN col.salario < (CASE col.faixa_atual WHEN 'I' THEN cg.faixa_i WHEN 'II' THEN cg.faixa_ii WHEN 'III' THEN cg.faixa_iii WHEN 'IV' THEN cg.faixa_iv WHEN 'V' THEN cg.faixa_v END) * 0.95
            THEN 'abaixo'
          WHEN col.salario > (CASE col.faixa_atual WHEN 'I' THEN cg.faixa_i WHEN 'II' THEN cg.faixa_ii WHEN 'III' THEN cg.faixa_iii WHEN 'IV' THEN cg.faixa_iv WHEN 'V' THEN cg.faixa_v END) * 1.05
            THEN 'acima'
          ELSE 'aderente'
        END AS status_aderencia
      FROM colaboradores col
      LEFT JOIN cargos cg ON cg.id = col.cargo_id
      WHERE col.empresa_id = $1 AND col.status = 'ativo'
      ORDER BY col.nome
    `, [empresaId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro ao calcular aderência' }); }
});

module.exports = router;
