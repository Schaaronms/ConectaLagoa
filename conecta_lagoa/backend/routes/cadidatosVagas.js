// server/routes/vagas.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); // ou seu client Neon

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/vagas', async (req, res) => {
  const { search = '', local = '', modelo = '', tipo = '' } = req.query;

  let query = `
    SELECT v.*, u.nome AS empresa_nome 
    FROM vagas v 
    JOIN usuarios u ON v.empresa_id = u.id 
    WHERE v.ativa = true
  `;
  const params = [];

  if (search) {
    query += ` AND v.titulo ILIKE $${params.length + 1}`;
    params.push(`%${search}%`);
  }
  if (local) {
    query += ` AND v.cidade ILIKE $${params.length + 1}`;
    params.push(`%${local}%`);
  }
  // adicione mais filtros (modelo = tipo_contrato, etc.)

  query += ' ORDER BY v.created_at DESC LIMIT 50';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
});

module.exports = router;