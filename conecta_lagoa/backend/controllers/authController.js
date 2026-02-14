const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Gerar token JWT
const generateToken = (id, tipo) => {
  return jwt.sign(
    { id, tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Registro de Candidato
const registroCandidato = async (req, res) => {
  try {
    const { nome_completo, email, telefone, cidade, estado } = req.body;

    // Verificar se email já existe
    const existing = await db.get('SELECT id FROM candidatos WHERE email = $1', [email]);
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado' });
    }

    // Inserir candidato (PostgreSQL não precisa de senha aqui, você não estava salvando)
    const result = await db.pool.query(
      `INSERT INTO candidatos (nome_completo, email, telefone, cidade, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nome_completo, email, telefone, cidade, estado]
    );

    const candidatoId = result.rows[0].id;
    const token = generateToken(candidatoId, 'candidato');

    res.status(201).json({
      success: true,
      message: 'Candidato cadastrado com sucesso',
      token,
      user: {
        id: candidatoId,
        nome: nome_completo,
        email,
        tipo: 'candidato'
      }
    });
  } catch (error) {
    console.error('Erro em registroCandidato:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Registro de Empresa
const registroEmpresa = async (req, res) => {
  try {
    const { nome, email, senha, cnpj, telefone, cidade, estado } = req.body;

    // Verificar se email já existe
    const existing = await db.get('SELECT id FROM empresas WHERE email = $1', [email]);
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir empresa
    const result = await db.pool.query(
      `INSERT INTO empresas (nome, email, senha, cnpj, telefone, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [nome, email, senhaHash, cnpj, telefone, cidade, estado]
    );

    const empresaId = result.rows[0].id;
    const token = generateToken(empresaId, 'empresa');

    res.status(201).json({
      success: true,
      message: 'Empresa cadastrada com sucesso',
      token,
      user: {
        id: empresaId,
        nome,
        email,
        tipo: 'empresa'
      }
    });
  } catch (error) {
    console.error('Erro em registroEmpresa:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, senha, tipo } = req.body;

    if (!['candidato', 'empresa'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo de usuário inválido' });
    }

    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const nomeField = tipo === 'candidato' ? 'nome_completo' : 'nome';

    const user = await db.get(`SELECT * FROM ${tabela} WHERE email = $1`, [email]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Verificar senha (apenas para empresas, candidatos não têm senha neste sistema)
    if (tipo === 'empresa') {
      const senhaValida = await bcrypt.compare(senha, user.senha);
      
      if (!senhaValida) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
    }

    // Atualizar último acesso
    await db.pool.query(
      `UPDATE ${tabela} SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    const token = generateToken(user.id, tipo);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user[nomeField],
        email: user.email,
        tipo
      }
    });
  } catch (error) {
    console.error('Erro em login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Obter perfil do usuário logado
const getProfile = async (req, res) => {
  try {
    const { id, tipo } = req.user;
    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';

    const user = await db.get(`SELECT * FROM ${tabela} WHERE id = $1`, [id]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // Remover senha
    delete user.senha;

    res.json({
      success: true,
      user: { ...user, tipo }
    });
  } catch (error) {
    console.error('Erro em getProfile:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

module.exports = {
  registroCandidato,
  registroEmpresa,
  login,
  getProfile
};
