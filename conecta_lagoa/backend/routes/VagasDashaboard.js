// routes/vagas.js — CRUD de vagas

const express = require('express');
const router  = express.Router();
const { authMiddleware, isEmpresa } = require('../middleware/auth');
const auth = [authMiddleware, isEmpresa];
const { db } = require('../config/database');

// Listar vagas da empresa
router.get('/', auth, async (req, res) => {
  try {
    const vagas = await sql`
      SELECT v.*,
        (SELECT COUNT(*) FROM candidaturas c WHERE c.vaga_id = v.id) AS total_candidaturas
      FROM vagas v
      WHERE v.empresa_id = ${req.user.id}
      ORDER BY v.criado_em DESC
    `;
    res.json(vagas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar vagas.' });
  }
});

// Publicar nova vaga
router.post('/', auth, async (req, res) => {
  const { titulo, descricao, area, cidade, tipo, salario_min, salario_max } = req.body;

  if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });

  // Checar limite de vagas por plano
  const limites = { basico: 3, pro: 10, enterprise: Infinity };
  const limite  = limites[req.empresa.plano] || 3;

  const [{ total }] = await sql`
    SELECT COUNT(*) AS total FROM vagas
    WHERE empresa_id = ${req.user.id} AND status = 'ativa'
  `;

  if (parseInt(total) >= limite) {
    return res.status(403).json({
      erro: `Seu plano ${req.empresa.plano} permite no máximo ${limite} vagas ativas. Faça upgrade para publicar mais.`
    });
  }

  try {
    const [vaga] = await sql`
      INSERT INTO vagas (empresa_id, titulo, descricao, area, cidade, tipo, salario_min, salario_max)
      VALUES (${req.user.id}, ${titulo}, ${descricao || null}, ${area || null},
              ${cidade || null}, ${tipo || null}, ${salario_min || null}, ${salario_max || null})
      RETURNING *
    `;
    res.status(201).json(vaga);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao publicar vaga.' });
  }
});

// Atualizar vaga
router.put('/:id', auth, async (req, res) => {
  const { titulo, descricao, area, cidade, tipo, salario_min, salario_max, status } = req.body;

  try {
    const [vaga] = await sql`
      UPDATE vagas SET
        titulo      = COALESCE(${titulo      || null}, titulo),
        descricao   = COALESCE(${descricao   || null}, descricao),
        area        = COALESCE(${area        || null}, area),
        cidade      = COALESCE(${cidade      || null}, cidade),
        tipo        = COALESCE(${tipo        || null}, tipo),
        salario_min = COALESCE(${salario_min || null}, salario_min),
        salario_max = COALESCE(${salario_max || null}, salario_max),
        status      = COALESCE(${status      || null}, status)
      WHERE id = ${req.params.id} AND empresa_id = ${req.user.id}
      RETURNING *
    `;
    if (!vaga) return res.status(404).json({ erro: 'Vaga não encontrada.' });
    res.json(vaga);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar vaga.' });
  }
});

// Encerrar vaga
router.delete('/:id', auth, async (req, res) => {
  try {
    await sql`
      UPDATE vagas SET status = 'encerrada', encerrado_em = NOW()
      WHERE id = ${req.params.id} AND empresa_id = ${req.user.id}
    `;
    res.json({ mensagem: 'Vaga encerrada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao encerrar vaga.' });
  }
});

// Atualizar status de candidatura
router.patch('/:vagaId/candidaturas/:candidaturaId', auth, async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['pendente', 'em_analise', 'aprovado', 'rejeitado', 'contratado'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  try {
    const [c] = await sql`
      UPDATE candidaturas SET status = ${status}
      WHERE id = ${req.params.candidaturaId}
        AND vaga_id = ${req.params.vagaId}
      RETURNING *
    `;
    if (!c) return res.status(404).json({ erro: 'Candidatura não encontrada.' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar candidatura.' });
  }
});

module.exports = router;