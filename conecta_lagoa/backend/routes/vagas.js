// ============================================
// routes/vagas.js — VERSÃO COMPLETA COM KANBAN
// Persiste stage, notas e avaliação no banco
// ============================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const authMiddleware = require('../middleware/auth');

// Status → stage (para sincronizar)
const STATUS_TO_STAGE = {
  'Enviado': 0, 'Visualizado': 0,
  'Em Análise': 1, 'Entrevista': 2,
  'Aprovado': 5, 'Reprovado': 6,
};
const STAGE_TO_STATUS = {
  0: 'Visualizado', 1: 'Em Análise', 2: 'Entrevista',
  3: 'Em Análise',  4: 'Em Análise', 5: 'Aprovado', 6: 'Reprovado',
};

// ─── ROTAS FIXAS (antes de /:id) ─────────────────────────────────

// GET /api/vagas/candidato/minhas
router.get('/candidato/minhas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        v.titulo        AS vaga_titulo,
        v.area          AS vaga_area,
        v.tipo_contrato,
        v.cidade,
        u.nome          AS empresa_nome
      FROM candidaturas c
      JOIN vagas    v ON c.vaga_id    = v.id
      JOIN usuarios u ON v.empresa_id = u.id
      WHERE c.candidato_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar candidaturas' });
  }
});

// ─── GET /api/vagas/empresa/minhas ───────────────────────────────
// Lista vagas ativas da empresa — usado no select do modal "Adicionar ao Funil"
router.get('/empresa/minhas', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const result = await pool.query(
      `SELECT id, titulo FROM vagas WHERE empresa_id = $1 AND ativa = true ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
});

// ─── POST /api/vagas/candidaturas/manual ─────────────────────────
// Empresa insere candidato manualmente no Funil pelo CPF
// Candidato precisa ter cadastro — CPF buscado via GET /api/usuarios/buscar-cpf/:cpf
router.post('/candidaturas/manual', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Apenas empresas podem fazer isso' });

    const { candidato_id, vaga_id, status = 'Visualizado', stage = 0, origem = 'manual' } = req.body;
    if (!candidato_id || !vaga_id) return res.status(400).json({ error: 'candidato_id e vaga_id são obrigatórios' });

    // Garante que a vaga pertence à empresa
    const vagaCheck = await pool.query(
      'SELECT id FROM vagas WHERE id = $1 AND empresa_id = $2 AND ativa = true',
      [vaga_id, req.user.id]
    );
    if (vagaCheck.rows.length === 0) return res.status(403).json({ error: 'Vaga não encontrada ou não pertence à sua empresa' });

    const result = await pool.query(`
      INSERT INTO candidaturas (vaga_id, candidato_id, status, stage, origem)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [vaga_id, candidato_id, status, stage, origem]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Este candidato já está no funil para essa vaga' });
    console.error(err);
    res.status(500).json({ error: 'Erro ao adicionar candidato' });
  }
});

// ─── GET /api/vagas/empresa/candidaturas ─────────────────────────
// Alimenta o PanelFunil (Kanban) — retorna stage, rating e notas
router.get('/empresa/candidaturas', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const result = await pool.query(`
      SELECT
        c.id,
        c.status,
        c.stage,
        c.rating,
        c.notas,
        c.score_ia,
        c.created_at,
        c.mensagem_candidato,
        v.id            AS vaga_id,
        v.titulo        AS vaga_titulo,
        u.id            AS candidato_id,
        u.nome          AS candidato_nome,
        u.email         AS candidato_email,
        COALESCE(u.cargo, u.area, 'Candidato') AS candidato_cargo
      FROM candidaturas c
      JOIN vagas    v ON c.vaga_id      = v.id
      JOIN usuarios u ON c.candidato_id = u.id
      WHERE v.empresa_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar candidaturas da empresa' });
  }
});

// ─── PUT /api/vagas/candidaturas/:id/stage ───────────────────────
// Move card no Kanban — salva stage E status sincronizados
router.put('/candidaturas/:id/stage', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const { stage } = req.body;
    if (stage === undefined) return res.status(400).json({ error: 'Campo stage obrigatório' });

    const stageNum = Number(stage);
    const status   = STAGE_TO_STATUS[stageNum] || 'Em Análise';

    const result = await pool.query(`
      UPDATE candidaturas
      SET stage = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, stage, status
    `, [stageNum, status, req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Candidatura não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao mover candidatura' });
  }
});

// ─── PUT /api/vagas/candidaturas/:id/rating ──────────────────────
// Salva avaliação (estrelas 0-5) da empresa sobre o candidato
router.put('/candidaturas/:id/rating', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const { rating } = req.body;
    if (rating === undefined) return res.status(400).json({ error: 'Campo rating obrigatório' });

    const result = await pool.query(`
      UPDATE candidaturas
      SET rating = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, rating
    `, [Math.min(5, Math.max(0, Number(rating))), req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar avaliação' });
  }
});

// ─── PUT /api/vagas/candidaturas/:id/notas ───────────────────────
// Salva array de notas do card (substitui inteiro)
router.put('/candidaturas/:id/notas', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const { notas } = req.body; // array de strings
    if (!Array.isArray(notas)) return res.status(400).json({ error: 'notas deve ser um array' });

    const result = await pool.query(`
      UPDATE candidaturas
      SET notas = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, notas
    `, [notas, req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar notas' });
  }
});

// ─── PUT /api/vagas/candidaturas/:id/status (legado) ─────────────
router.put('/candidaturas/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const { status } = req.body;
    const stage = STATUS_TO_STAGE[status] ?? 0;
    const result = await pool.query(`
      UPDATE candidaturas
      SET status = $1, stage = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [status, stage, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ─── MENSAGENS (fixas antes de /:id) ─────────────────────────────

router.get('/mensagens/minhas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, u.nome AS remetente_nome, v.titulo AS vaga_titulo
      FROM mensagens m
      JOIN usuarios     u ON m.remetente_id   = u.id
      JOIN candidaturas c ON m.candidatura_id = c.id
      JOIN vagas        v ON c.vaga_id        = v.id
      WHERE m.destinatario_id = $1
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

router.post('/mensagens', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const { candidatura_id, destinatario_id, conteudo } = req.body;
    const result = await pool.query(`
      INSERT INTO mensagens (candidatura_id, remetente_id, destinatario_id, conteudo)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [candidatura_id, req.user.id, destinatario_id, conteudo]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.put('/mensagens/:id/lida', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE mensagens SET lida = true WHERE id = $1 AND destinatario_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Mensagem marcada como lida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar mensagem' });
  }
});

// ─── VAGAS (/:id por último) ──────────────────────────────────────

// GET /api/vagas — listagem pública
router.get('/', async (req, res) => {
  try {
    const { area, tipo_contrato, busca, search, local, modelo } = req.query;
    const termo = search || busca;

    let query = `
      SELECT v.*, u.nome AS empresa_nome
      FROM vagas v
      JOIN usuarios u ON v.empresa_id = u.id
      WHERE v.ativa = true
    `;
    const params = [];

    if (area)         { params.push(area);           query += ` AND v.area = $${params.length}`; }
    if (tipo_contrato){ params.push(tipo_contrato);   query += ` AND v.tipo_contrato = $${params.length}`; }
    if (local)        { params.push(`%${local}%`);    query += ` AND v.cidade ILIKE $${params.length}`; }
    if (modelo)       { params.push(modelo);          query += ` AND v.modelo = $${params.length}`; }
    if (termo)        { params.push(`%${termo}%`);    query += ` AND (v.titulo ILIKE $${params.length} OR v.descricao ILIKE $${params.length})`; }

    query += ' ORDER BY v.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
});

// POST /api/vagas — criar vaga (ativa=true por padrão)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Apenas empresas podem criar vagas' });
    const { titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo = 'Presencial', pcd = false } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });

    const result = await pool.query(`
      INSERT INTO vagas
        (empresa_id, titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd, ativa)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, true)
      RETURNING *
    `, [req.user.id, titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar vaga' });
  }
});

// POST /api/vagas/:id/candidatar
router.post('/:id/candidatar', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'candidato') return res.status(403).json({ error: 'Apenas candidatos podem se candidatar' });
    const { mensagem_candidato } = req.body;
    const result = await pool.query(`
      INSERT INTO candidaturas (vaga_id, candidato_id, mensagem_candidato, stage, status)
      VALUES ($1, $2, $3, 0, 'Enviado')
      RETURNING *
    `, [req.params.id, req.user.id, mensagem_candidato]);
    res.status(201).json({ message: 'Candidatura enviada com sucesso!', candidatura: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Você já se candidatou a esta vaga' });
    res.status(500).json({ error: 'Erro ao candidatar' });
  }
});

// GET /api/vagas/:id/candidatos
router.get('/:id/candidatos', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const result = await pool.query(`
      SELECT c.*, u.nome AS candidato_nome, u.email AS candidato_email
      FROM candidaturas c
      JOIN usuarios u ON c.candidato_id = u.id
      WHERE c.vaga_id = $1
      ORDER BY c.created_at DESC
    `, [req.params.id]);
    await pool.query(
      `UPDATE candidaturas SET status='Visualizado', updated_at=NOW() WHERE vaga_id=$1 AND status='Enviado'`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar candidatos' });
  }
});

// GET /api/vagas/:id — detalhe (por último!)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.nome AS empresa_nome
      FROM vagas v JOIN usuarios u ON v.empresa_id = u.id
      WHERE v.id = $1 AND v.ativa = true
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vaga' });
  }
});

// PUT /api/vagas/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd, ativa } = req.body;
    const result = await pool.query(`
      UPDATE vagas SET
        titulo=$1, descricao=$2, area=$3, tipo_contrato=$4, cidade=$5,
        salario=$6, requisitos=$7, modelo=$8, pcd=$9, ativa=$10, updated_at=NOW()
      WHERE id=$11 AND empresa_id=$12 RETURNING *
    `, [titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd, ativa, req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar vaga' });
  }
});

// DELETE /api/vagas/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE vagas SET ativa=false WHERE id=$1 AND empresa_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Vaga desativada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar vaga' });
  }
});

module.exports = router;