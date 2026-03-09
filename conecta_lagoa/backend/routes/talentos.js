// routes/talentos.js — Conecta Lagoa
// Banco de Talentos: lista candidatos, persiste favoritos, envia convites
const express = require('express');
const router  = express.Router();
// utiliza pool vindo de config/db
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/talentos — empresa lista todos os candidatos cadastrados
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    // Busca candidatos com flag de favorito da empresa atual
    const result = await pool.query(`
      SELECT
        u.id,
        u.nome,
        u.email,
        u.telefone,
        u.cargo,
        u.area,
        u.cidade,
        u.habilidades,
        u.score_ia,
        -- favorito é por empresa (tabela de join)
        COALESCE(f.favorito, false)      AS favorito,
        f.created_at                     AS fav_at
      FROM usuarios u
      LEFT JOIN talentos_favoritos f
        ON f.candidato_id = u.id AND f.empresa_id = $1
      WHERE u.tipo = 'candidato'
      ORDER BY u.nome ASC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar talentos' });
  }
});

// PATCH /api/talentos/:id/favorito — empresa favorita/desfavorita um candidato
router.patch('/:id/favorito', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const { favorito } = req.body;
    const candidato_id = Number(req.params.id);

    if (favorito) {
      // Upsert: insere ou atualiza
      await pool.query(`
        INSERT INTO talentos_favoritos (empresa_id, candidato_id, favorito)
        VALUES ($1, $2, true)
        ON CONFLICT (empresa_id, candidato_id)
        DO UPDATE SET favorito = true, created_at = NOW()
      `, [req.user.id, candidato_id]);
    } else {
      await pool.query(`
        DELETE FROM talentos_favoritos
        WHERE empresa_id = $1 AND candidato_id = $2
      `, [req.user.id, candidato_id]);
    }

    res.json({ ok: true, favorito });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar favorito' });
  }
});

// POST /api/mensagens — empresa envia convite/mensagem para candidato
// (já existe em vagas.js mas adicionamos aqui como rota direta sem candidatura)
router.post('/mensagens', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const { destinatario_id, conteudo } = req.body;
    if (!destinatario_id || !conteudo?.trim())
      return res.status(400).json({ error: 'destinatario_id e conteudo são obrigatórios' });

    const result = await pool.query(`
      INSERT INTO mensagens (remetente_id, destinatario_id, conteudo)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.user.id, destinatario_id, conteudo]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;