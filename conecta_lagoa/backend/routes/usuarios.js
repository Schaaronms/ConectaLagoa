// routes/usuarios.js -- Conecta Lagoa
const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/usuarios/buscar-cpf/:cpf
router.get('/buscar-cpf/:cpf', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa')
      return res.status(403).json({ error: 'Apenas empresas podem buscar candidatos' });

    const cpf = req.params.cpf.replace(/\D/g, '');
    if (cpf.length !== 11)
      return res.status(400).json({ error: 'CPF invalido' });

    const result = await pool.query(
      'SELECT id, nome, email, telefone, tipo, cargo, area, cidade FROM usuarios WHERE cpf = $1',
      [cpf]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Candidato nao encontrado. O candidato precisa ter cadastro na plataforma.' });

    const u = result.rows[0];
    res.json({ id: u.id, nome: u.nome, email: u.email, telefone: u.telefone, tipo: u.tipo, cargo: u.cargo, area: u.area, cidade: u.cidade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar candidato' });
  }
});

// PATCH /api/usuarios/perfil -- atualiza skills/experiencia do candidato
router.patch('/perfil', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'candidato')
      return res.status(403).json({ success: false, message: 'Apenas candidatos podem usar este endpoint' });

    const { skills_estruturadas, experiencia_anos, nivel_senioridade } = req.body;

    const niveisValidos = ['estagiario', 'junior', 'pleno', 'senior', 'especialista'];
    if (nivel_senioridade && !niveisValidos.includes(nivel_senioridade))
      return res.status(400).json({ success: false, message: 'nivel_senioridade invalido' });

    if (experiencia_anos !== undefined && (isNaN(experiencia_anos) || experiencia_anos < 0 || experiencia_anos > 60))
      return res.status(400).json({ success: false, message: 'experiencia_anos invalido' });

    await pool.query(
      `UPDATE usuarios
       SET skills_estruturadas = COALESCE($1::jsonb, skills_estruturadas),
           experiencia_anos    = COALESCE($2, experiencia_anos),
           nivel_senioridade   = COALESCE($3, nivel_senioridade),
           ultima_analise_ia   = NULL
       WHERE id = $4`,
      [
        skills_estruturadas ? JSON.stringify(skills_estruturadas) : null,
        experiencia_anos ?? null,
        nivel_senioridade || null,
        req.user.id,
      ]
    );

    try {
      await pool.query('DELETE FROM scores_ia_cache WHERE candidato_id = $1', [req.user.id]);
    } catch (_) {}

    res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error('[PATCH /usuarios/perfil]', err.message);
    res.status(500).json({ success: false, message: 'Erro ao salvar perfil' });
  }
});

// POST /api/usuarios/alterar-senha
router.post('/alterar-senha', authMiddleware, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { senha_atual, nova_senha } = req.body;

    if (!senha_atual || !nova_senha)
      return res.status(400).json({ success: false, message: 'Campos obrigatorios nao preenchidos' });

    if (nova_senha.length < 6)
      return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres' });

    const result = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Usuario nao encontrado' });

    const senhaCorreta = await bcrypt.compare(senha_atual, result.rows[0].senha);
    if (!senhaCorreta)
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' });

    const novoHash = await bcrypt.hash(nova_senha, 12);
    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novoHash, req.user.id]);

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('[POST /usuarios/alterar-senha]', err.message);
    res.status(500).json({ success: false, message: 'Erro ao alterar senha' });
  }
});

// PATCH /api/usuarios/dados -- atualiza nome, telefone, cidade
router.patch('/dados', authMiddleware, async (req, res) => {
  try {
    const { nome, telefone, cidade } = req.body;
    await pool.query(
      `UPDATE usuarios
       SET nome     = COALESCE($1, nome),
           telefone = COALESCE($2, telefone),
           cidade   = COALESCE($3, cidade),
           updated_at = NOW()
       WHERE id = $4`,
      [nome || null, telefone || null, cidade || null, req.user.id]
    );
    res.json({ success: true, message: 'Dados atualizados com sucesso' });
  } catch (err) {
    console.error('[PATCH /usuarios/dados]', err.message);
    res.status(500).json({ success: false, message: 'Erro ao atualizar dados' });
  }
});

module.exports = router;
