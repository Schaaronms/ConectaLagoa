// routes/usuarios.js — Conecta Lagoa
const express = require('express');
const router  = express.Router();
// pool is exported from config/db (see database-postgres.js)
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/usuarios/buscar-cpf/:cpf
// Empresa busca candidato pelo CPF para adicionar manualmente ao Funil
router.get('/buscar-cpf/:cpf', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa')
      return res.status(403).json({ error: 'Apenas empresas podem buscar candidatos' });

    const cpf = req.params.cpf.replace(/\D/g, '');
    if (cpf.length !== 11)
      return res.status(400).json({ error: 'CPF inválido' });

    const result = await pool.query(`
      SELECT
        id, nome, email, telefone, tipo,
        cargo, area, cidade
      FROM usuarios
      WHERE cpf = $1
    `, [cpf]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Nenhum candidato encontrado com esse CPF. O candidato precisa ter cadastro na plataforma.' });

    const u = result.rows[0];

    // Retorna só o necessário — sem senha ou dados sensíveis
    res.json({
      id:       u.id,
      nome:     u.nome,
      email:    u.email,
      telefone: u.telefone,
      tipo:     u.tipo,
      cargo:    u.cargo,
      area:     u.area,
      cidade:   u.cidade,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar candidato' });
  }
});

// ── PATCH /api/usuarios/perfil ────────────────────────────────────
// Atualiza campos de perfil do candidato (skills IA)
router.patch('/perfil', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'candidato') {
      return res.status(403).json({ success: false, message: 'Apenas candidatos podem usar este endpoint' });
    }

    const { skills_estruturadas, experiencia_anos, nivel_senioridade } = req.body;

    // Validações básicas
    const niveisValidos = ['estagiario', 'junior', 'pleno', 'senior', 'especialista'];
    if (nivel_senioridade && !niveisValidos.includes(nivel_senioridade)) {
      return res.status(400).json({ success: false, message: 'nivel_senioridade inválido' });
    }
    if (experiencia_anos !== undefined && (isNaN(experiencia_anos) || experiencia_anos < 0 || experiencia_anos > 60)) {
      return res.status(400).json({ success: false, message: 'experiencia_anos inválido' });
    }

    await pool.query(
      `UPDATE usuarios
       SET
         skills_estruturadas = COALESCE($1::jsonb, skills_estruturadas),
         experiencia_anos    = COALESCE($2, experiencia_anos),
         nivel_senioridade   = COALESCE($3, nivel_senioridade),
         ultima_analise_ia   = NULL  -- força recálculo do score na próxima candidatura
       WHERE id = $4`,
      [
        skills_estruturadas ? JSON.stringify(skills_estruturadas) : null,
        experiencia_anos    ?? null,
        nivel_senioridade   || null,
        req.user.id,
      ]
    );

    // Invalida cache de scores IA para este candidato
    // (para que scores sejam recalculados com o novo perfil)
    await pool.query(
      `DELETE FROM scores_ia_cache WHERE candidato_id = $1`,
      [req.user.id]
    );

    res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error('[PATCH /usuarios/perfil]', err.message);
    res.status(500).json({ success: false, message: 'Erro ao salvar perfil' });
  }
});


module.exports = router;