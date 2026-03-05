
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const authMiddleware = require('../middleware/auth');

// ─── ROTAS FIXAS PRIMEIRO — antes de qualquer /:id ───────────────
// ⚠️ CRÍTICO: se estas ficarem depois de GET /:id, o Express
//    interpreta "candidato" e "mensagens" como IDs e retorna 404.

// GET /api/vagas/candidato/minhas
router.get('/candidato/minhas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        v.titulo  AS vaga_titulo,
        v.area    AS vaga_area,
        v.tipo_contrato,
        v.cidade,
        u.nome    AS empresa_nome
      FROM candidaturas c
      JOIN vagas    v ON c.vaga_id      = v.id
      JOIN usuarios u ON v.empresa_id   = u.id
      WHERE c.candidato_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar candidaturas' });
  }
});

// GET /api/vagas/empresa/candidaturas — alimenta o Kanban (PanelFunil.jsx)
router.get('/empresa/candidaturas', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });

    const result = await pool.query(`
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.mensagem_candidato,
        v.id    AS vaga_id,
        v.titulo AS vaga_titulo,
        u.nome  AS candidato_nome,
        u.email AS candidato_email,
        u.telefone AS candidato_telefone,
        -- cargo do candidato (se existir coluna no perfil)
        COALESCE(p.cargo, u.area, 'Candidato') AS candidato_cargo
      FROM candidaturas c
      JOIN vagas    v ON c.vaga_id      = v.id
      JOIN usuarios u ON c.candidato_id = u.id
      LEFT JOIN perfis p ON p.usuario_id = u.id
      WHERE v.empresa_id = $1
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar candidaturas da empresa' });
  }
});

// GET /api/vagas/mensagens/minhas
router.get('/mensagens/minhas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        u.nome  AS remetente_nome,
        v.titulo AS vaga_titulo
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

// POST /api/vagas/mensagens
router.post('/mensagens', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Apenas empresas podem enviar mensagens' });
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

// PUT /api/vagas/mensagens/:id/lida
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

// PUT /api/vagas/candidaturas/:id/status
router.put('/candidaturas/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const { status } = req.body;
    const result = await pool.query(`
      UPDATE candidaturas SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// PUT /api/vagas/candidaturas/:id/stage — move no Kanban
router.put('/candidaturas/:id/stage', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const { status } = req.body; // PanelFunil manda { stage, status }
    const result = await pool.query(`
      UPDATE candidaturas SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao mover candidatura' });
  }
});

// ─── VAGAS (rotas com /:id por último) ───────────────────────────

// GET /api/vagas — lista pública com filtros
router.get('/', async (req, res) => {
  try {
    // Aceita tanto "search" (frontend) quanto "busca" (versão antiga)
    const { area, tipo_contrato, busca, search, local, modelo } = req.query;
    const termo = search || busca; // normaliza

    let query = `
      SELECT v.*, u.nome AS empresa_nome
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
    if (local) {
      params.push(`%${local}%`);
      query += ` AND v.cidade ILIKE $${params.length}`;
    }
    if (modelo) {
      params.push(modelo);
      query += ` AND v.modelo = $${params.length}`;
    }
    if (termo) {
      params.push(`%${termo}%`);
      // Mesmo índice para os dois ILIKE — PostgreSQL aceita repetição de $N
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

// POST /api/vagas — empresa cria vaga
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Apenas empresas podem criar vagas' });

    const {
      titulo, descricao, area, tipo_contrato,
      cidade, salario, requisitos,
      modelo = 'Presencial', // novo campo
      pcd    = false,        // novo campo
    } = req.body;

    if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });

    const result = await pool.query(`
      INSERT INTO vagas
        (empresa_id, titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd, ativa)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *
    `, [
      req.user.id, titulo, descricao, area,
      tipo_contrato, cidade, salario, requisitos,
      modelo, pcd,
      // ativa = true (hardcoded) — vaga aparece imediatamente na listagem pública
    ]);

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
      INSERT INTO candidaturas (vaga_id, candidato_id, mensagem_candidato)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.params.id, req.user.id, mensagem_candidato]);
    res.status(201).json({ message: 'Candidatura enviada com sucesso!', candidatura: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Você já se candidatou a esta vaga' });
    res.status(500).json({ error: 'Erro ao candidatar' });
  }
});

// GET /api/vagas/:id/candidatos — empresa vê candidatos de uma vaga
router.get('/:id/candidatos', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') return res.status(403).json({ error: 'Acesso negado' });
    const result = await pool.query(`
      SELECT c.*, u.nome AS candidato_nome, u.email AS candidato_email, u.telefone AS candidato_telefone
      FROM candidaturas c
      JOIN usuarios u ON c.candidato_id = u.id
      WHERE c.vaga_id = $1
      ORDER BY c.created_at DESC
    `, [req.params.id]);
    await pool.query(`
      UPDATE candidaturas SET status = 'Visualizado', updated_at = NOW()
      WHERE vaga_id = $1 AND status = 'Enviado'
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar candidatos' });
  }
});

// GET /api/vagas/:id — detalhe de uma vaga (por último!)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, u.nome AS empresa_nome
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

// PUT /api/vagas/:id — editar vaga
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd, ativa } = req.body;
    const result = await pool.query(`
      UPDATE vagas SET
        titulo        = COALESCE($1,  titulo),
        descricao     = COALESCE($2,  descricao),
        area          = COALESCE($3,  area),
        tipo_contrato = COALESCE($4,  tipo_contrato),
        cidade        = COALESCE($5,  cidade),
        salario       = COALESCE($6,  salario),
        requisitos    = COALESCE($7,  requisitos),
        modelo        = COALESCE($8,  modelo),
        pcd           = COALESCE($9,  pcd),
        ativa         = COALESCE($10, ativa),
        updated_at    = NOW()
      WHERE id = $11 AND empresa_id = $12
      RETURNING *
    `, [titulo, descricao, area, tipo_contrato, cidade, salario, requisitos, modelo, pcd, ativa, req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vaga não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar vaga' });
  }
});

// DELETE /api/vagas/:id — desativar vaga
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

module.exports = router;
