const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const crypto = require('crypto');

// Gerar token JWT
const generateToken = (id, tipo) => {
  return jwt.sign(
    { id, tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};



// =============================
// REGISTRO DE CANDIDATO
// =============================
const registroCandidato = async (req, res) => {
  try {
    const { nome_completo, email, senha, telefone, cidade, estado } = req.body;

    if (!senha) {
      return res.status(400).json({ success: false, message: 'Senha é obrigatória' });
    }

    // Verificar se email já existe
    const existing = await db.get(
      'SELECT id FROM candidatos WHERE email = $1',
      [email]
    );

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir candidato
    const result = await db.pool.query(
      `INSERT INTO candidatos 
       (nome_completo, email, senha, telefone, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [nome_completo, email, senhaHash, telefone, cidade, estado]
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



// =============================
// REGISTRO DE EMPRESA
// =============================
const registroEmpresa = async (req, res) => {
  try {
    const { nome, email, senha, cnpj, telefone, cidade, estado } = req.body;

    if (!senha) {
      return res.status(400).json({ success: false, message: 'Senha é obrigatória' });
    }

    const existing = await db.get(
      'SELECT id FROM empresas WHERE email = $1',
      [email]
    );

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await db.pool.query(
      `INSERT INTO empresas 
       (nome, email, senha, cnpj, telefone, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
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



// =============================
// LOGIN (CANDIDATO E EMPRESA)
// =============================
const login = async (req, res) => {
  try {
    const { email, senha, tipo } = req.body;

    if (!['candidato', 'empresa'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo de usuário inválido' });
    }

    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const nomeField = tipo === 'candidato' ? 'nome_completo' : 'nome';

    const user = await db.get(
      `SELECT * FROM ${tabela} WHERE email = $1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // VALIDAR SENHA PARA AMBOS
    const senhaValida = await bcrypt.compare(senha, user.senha);
pare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id, tipo);

    res.json({
      success: true,
      message: 'Login bem-sucedido',
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



// =============================
// GET PROFILE
// =============================
const getProfile = async (req, res) => {
  try {
    const { id, tipo } = req.user;
    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const nomeField = tipo === 'candidato' ? 'nome_completo' : 'nome';

    const user = await db.get(`SELECT * FROM ${tabela} WHERE id = $1`, [id]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({ success: true, user: { id: user.id, nome: user[nomeField], email: user.email, tipo } });
  } catch (error) {
    console.error('Erro em getProfile:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
  


  const crypto = require('crypto');
const { enviarEmail } = require('../config/email');

// =============================
// ESQUECEU SENHA
// =============================
const esqueceuSenha = async (req, res) => {
  try {
    const { email, tipo } = req.body;

    if (!['candidato', 'empresa'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }

    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';

    const user = await db.get(`SELECT * FROM ${tabela} WHERE email = $1`, [email]);

    if (!user) {
      // Retorna sucesso mesmo se não encontrar, por segurança
      return res.json({ success: true, message: 'Se o email existir, você receberá as instruções' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.pool.query(
      `UPDATE ${tabela} SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
      [token, expiry, user.id]
    );

    const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&tipo=${tipo}`;

    await enviarEmail({
      para: email,
      assunto: 'Redefinição de senha - Conecta Lagoa',
      html: `
        <h2>Redefinição de senha</h2>
        <p>Clique no link abaixo para redefinir sua senha. O link expira em 1 hora.</p>
        <a href="${link}" style="background:#007bff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Redefinir senha
        </a>
        <p>Se não foi você, ignore este email.</p>
      `
    });

    res.json({ success: true, message: 'Se o email existir, você receberá as instruções' });

  } catch (error) {
    console.error('Erro em esqueceuSenha:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// =============================
// REDEFINIR SENHA
// =============================
const redefinirSenha = async (req, res) => {
  try {
    const { token, tipo, novaSenha } = req.body;

    if (!['candidato', 'empresa'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }

    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';

    const user = await db.get(
      `SELECT * FROM ${tabela} WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await db.pool.query(
      `UPDATE ${tabela} SET senha = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [senhaHash, user.id]
    );

    res.json({ success: true, message: 'Senha redefinida com sucesso' });

  } catch (error) {
    console.error('Erro em redefinirSenha:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

};

module.exports = { registroCandidato, registroEmpresa, login, getProfile, esqueceuSenha, redefinirSenha };
