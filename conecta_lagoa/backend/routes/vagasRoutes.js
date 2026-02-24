// ============================================
// routes/vagas.js - Rotas de Vagas e Candidaturas
// ============================================

const express = require('express');
const router = express.Router();
const pool = require('../db'); // seu pool do PostgreSQL
const authMiddleware = require('../middleware/auth'); // seu middleware de auth

// ─── VAGAS ───────────────────────────────────

// GET /api/vagas - listar todas as vagas ativas (público)
router.get('/', async (req, res) => {
  try {
    const { area, tipo_contrato, busca } = req.query;
    
    let query = `
      SELECT v.*, u.nome as empresa_nome
      FROM vagas v
      JOIN usuarios u ON v.empresa_id = u.id
      WHERE v.ativa = true
    `;
    const params = [];

    if (area) {
      params.push(area);
      query += ` AND v.area = $${params.length}`;
    }
    if (tipo_contrato) {
      params.push(tipo_contrato);
      query += ` AND v.tipo_contrato = $${params.length}`;
    }
    if (busca) {
      params.push(`%${busca}%`);
      query += ` AND (v.titulo ILIKE $${params.length} OR v.descricao ILIKE $${params.length})`;
    }

    query += ' ORDER BY v.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
});

// GET /api/vagas/:id - detalhes de uma vaga
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.nome as empresa_nome
      FROM vagas v
      JOIN usuarios u ON v.empresa_id = u.id
      WHERE v.id = $1 AND v.ativa = true
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vaga' });
  }
});

// POST /api/vagas - empresa cria nova vaga
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Apenas empresas podem criar vagas' });

    const { titulo, descricao, area, tipo_contrato, cidade, salario, requisitos } = req.body;

    const result = await pool.query(`
      INSERT INTO vagas (empresa_id, titulo, descricao, area, tipo_contrato, cidade, salario, requisitos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.id, titulo, descricao, area, tipo_contrato, cidade, salario, requisitos]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar vaga' });
  }
});

// PUT /api/vagas/:id - empresa edita vaga
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, ativa } = req.body;

    const result = await pool.query(`
      UPDATE vagas SET
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        area = COALESCE($3, area),
        tipo_contrato = COALESCE($4, tipo_contrato),
        cidade = COALESCE($5, cidade),
        salario = COALESCE($6, salario),
        requisitos = COALESCE($7, requisitos),
        ativa = COALESCE($8, ativa),
        updated_at = NOW()
      WHERE id = $9 AND empresa_id = $10
      RETURNING *
    `, [titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, ativa, req.params.id, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar vaga' });
  }
});

// DELETE /api/vagas/:id - empresa desativa vaga
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE vagas SET ativa = false WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Vaga desativada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar vaga' });
  }
});

// ─── CANDIDATURAS ─────────────────────────────

// POST /api/vagas/:id/candidatar - candidato se aplica
router.post('/:id/candidatar', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'candidato') return res.status(403).json({ error: 'Apenas candidatos podem se candidatar' });

    const { mensagem_candidato } = req.body;

    const result = await pool.query(`
      INSERT INTO candidaturas (vaga_id, candidato_id, mensagem_candidato)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.params.id, req.user.id, mensagem_candidato]);

    res.status(201).json({ message: 'Candidatura enviada com sucesso!', candidatura: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Você já se candidatou a esta vaga' });
    res.status(500).json({ error: 'Erro ao candidatar' });
  }
});

// GET /api/vagas/candidato/minhas - candidato vê suas candidaturas
router.get('/candidato/minhas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        v.titulo as vaga_titulo,
        v.area as vaga_area,
        v.tipo_contrato,
        v.cidade,
        u.nome as empresa_nome
      FROM candidaturas c
      JOIN vagas v ON c.vaga_id = v.id
      JOIN usuarios u ON v.empresa_id = u.id
      WHERE c.candidato_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar candidaturas' });
  }
});

// GET /api/vagas/:id/candidatos - empresa vê candidatos da vaga
router.get('/:id/candidatos', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const result = await pool.query(`
      SELECT 
        c.*,
        u.nome as candidato_nome,
        u.email as candidato_email,
        u.telefone as candidato_telefone
      FROM candidaturas c
      JOIN usuarios u ON c.candidato_id = u.id
      WHERE c.vaga_id = $1
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    // Marca candidaturas como visualizadas
    await pool.query(`
      UPDATE candidaturas SET status = 'Visualizado', updated_at = NOW()
      WHERE vaga_id = $1 AND status = 'Enviado'
    `, [req.params.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar candidatos' });
  }
});

// PUT /api/candidaturas/:id/status - empresa atualiza status
router.put('/candidaturas/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const { status } = req.body;
    const result = await pool.query(`
      UPDATE candidaturas SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ─── MENSAGENS ────────────────────────────────

// GET /api/mensagens - candidato vê suas mensagens
router.get('/mensagens/minhas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        u.nome as remetente_nome,
        v.titulo as vaga_titulo
      FROM mensagens m
      JOIN usuarios u ON m.remetente_id = u.id
      JOIN candidaturas c ON m.candidatura_id = c.id
      JOIN vagas v ON c.vaga_id = v.id
      WHERE m.destinatario_id = $1
      ORDER BY m.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// POST /api/mensagens - empresa envia mensagem para candidato
router.post('/mensagens', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Apenas empresas podem enviar mensagens' });

    const { candidatura_id, destinatario_id, conteudo } = req.body;

    const result = await pool.query(`
      INSERT INTO mensagens (candidatura_id, remetente_id, destinatario_id, conteudo)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [candidatura_id, req.user.id, destinatario_id, conteudo]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// PUT /api/mensagens/:id/lida - marca mensagem como lida
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

module.exports = router;
