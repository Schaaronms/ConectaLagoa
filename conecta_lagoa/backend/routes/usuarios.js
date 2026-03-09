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

module.exports = router;