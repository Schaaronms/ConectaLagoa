// ============================================
// routes/agenda.js — Conecta Lagoa
// CRUD completo de agendamentos e lembretes
// ============================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/agenda — lista eventos da empresa (filtro por data opcional)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;

    let query = `
      SELECT
        a.*,
        u.nome AS candidato_nome
      FROM agenda a
      LEFT JOIN usuarios u ON a.candidato_id = u.id
      WHERE a.empresa_id = $1
    `;
    const params = [req.user.id];

    if (data_inicio) {
      params.push(data_inicio);
      query += ` AND a.data_hora >= $${params.length}`;
    }
    if (data_fim) {
      params.push(data_fim);
      query += ` AND a.data_hora <= $${params.length}`;
    }

    query += ' ORDER BY a.data_hora ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar agenda' });
  }
});

// GET /api/agenda/mes?ano=2025&mes=3 — dias com eventos (para o calendário)
router.get('/mes', authMiddleware, async (req, res) => {
  try {
    const { ano, mes } = req.query;
    if (!ano || !mes) return res.status(400).json({ error: 'Informe ano e mes' });

    const result = await pool.query(`
      SELECT
        EXTRACT(DAY FROM data_hora)::int AS dia,
        COUNT(*) AS total
      FROM agenda
      WHERE empresa_id = $1
        AND EXTRACT(YEAR  FROM data_hora) = $2
        AND EXTRACT(MONTH FROM data_hora) = $3
      GROUP BY dia
      ORDER BY dia
    `, [req.user.id, Number(ano), Number(mes)]);

    // Retorna mapa { dia: total }
    const mapa = {};
    result.rows.forEach(r => { mapa[r.dia] = Number(r.total); });
    res.json(mapa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dias com eventos' });
  }
});

// GET /api/agenda/dia?data=2025-03-05 — eventos de um dia específico
router.get('/dia', authMiddleware, async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ error: 'Informe a data (YYYY-MM-DD)' });

    const result = await pool.query(`
      SELECT
        a.*,
        u.nome AS candidato_nome
      FROM agenda a
      LEFT JOIN usuarios u ON a.candidato_id = u.id
      WHERE a.empresa_id = $1
        AND DATE(a.data_hora) = $2
      ORDER BY a.data_hora ASC
    `, [req.user.id, data]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar eventos do dia' });
  }
});

// POST /api/agenda — criar evento
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      titulo,
      candidato_nome,   // nome livre se não tiver candidato_id
      candidato_id,     // opcional — link com usuario
      data_hora,        // "2025-03-05T14:00"
      tipo,             // Triagem | Entrevista | Técnico | Proposta | Feedback | Lembrete
      formato,          // Presencial | Video Call | Google Meet | Teams | Telefone
      observacao,
      lembrete_min,     // minutos antes para notificar (opcional)
    } = req.body;

    if (!titulo)    return res.status(400).json({ error: 'Título é obrigatório' });
    if (!data_hora) return res.status(400).json({ error: 'Data/hora é obrigatória' });

    const result = await pool.query(`
      INSERT INTO agenda
        (empresa_id, candidato_id, candidato_nome, titulo, data_hora, tipo, formato, observacao, lembrete_min)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      req.user.id,
      candidato_id || null,
      candidato_nome || null,
      titulo,
      data_hora,
      tipo || 'Entrevista',
      formato || 'Video Call',
      observacao || null,
      lembrete_min || 30,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// PUT /api/agenda/:id — editar evento
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { titulo, candidato_nome, candidato_id, data_hora, tipo, formato, observacao, lembrete_min } = req.body;

    const result = await pool.query(`
      UPDATE agenda SET
        titulo         = COALESCE($1, titulo),
        candidato_nome = COALESCE($2, candidato_nome),
        candidato_id   = COALESCE($3, candidato_id),
        data_hora      = COALESCE($4, data_hora),
        tipo           = COALESCE($5, tipo),
        formato        = COALESCE($6, formato),
        observacao     = COALESCE($7, observacao),
        lembrete_min   = COALESCE($8, lembrete_min),
        updated_at     = NOW()
      WHERE id = $9 AND empresa_id = $10
      RETURNING *
    `, [titulo, candidato_nome, candidato_id, data_hora, tipo, formato, observacao, lembrete_min, req.params.id, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar evento' });
  }
});

// DELETE /api/agenda/:id — remover evento
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM agenda WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json({ message: 'Evento removido', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover evento' });
  }
});

module.exports = router;
