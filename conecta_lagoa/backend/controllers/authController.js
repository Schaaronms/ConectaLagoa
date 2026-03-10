// controllers/authController.js — Conecta Lagoa
// FIXES DE SEGURANÇA:
//  1. bcrypt salt 10 → 12 (mais resistente a brute force)
//  2. Validação de email (formato) e senha (mínimo 8 chars + complexidade)
//  3. Sanitização de inputs (trim + strip tags básico)
//  4. getProfile não retorna mais SELECT * (nunca vaza hash de senha)
//  5. Mensagem de erro genérica no login (não revela se email existe)
//  6. novaSenha validada antes de redefinir

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/database');
const { enviarEmail } = require('../config/email');

const BCRYPT_ROUNDS = 12; // era 10 — custo maior, mais seguro

// ── Helpers de validação ──────────────────────────────────────────

// Sanitiza string: remove espaços extras e caracteres HTML básicos
const sanitize = (str) =>
  typeof str === 'string'
    ? str.trim().replace(/[<>'"]/g, '')
    : '';

// Valida formato de email
const emailValido = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).toLowerCase());

// Valida força de senha: mínimo 8 chars, 1 letra, 1 número
const senhaValida = (senha) =>
  typeof senha === 'string' &&
  senha.length >= 8 &&
  /[a-zA-Z]/.test(senha) &&
  /[0-9]/.test(senha);

// ── generateToken ─────────────────────────────────────────────────
const generateToken = (id, tipo) =>
  jwt.sign({ id, tipo }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

// ── registroCandidato ─────────────────────────────────────────────
const registroCandidato = async (req, res) => {
  try {
    const nome_completo = sanitize(req.body.nome_completo);
    const email         = sanitize(req.body.email)?.toLowerCase();
    const { senha }     = req.body;
    const telefone      = sanitize(req.body.telefone);
    const cidade        = sanitize(req.body.cidade);
    const estado        = sanitize(req.body.estado);

    // Validações
    if (!nome_completo) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
    if (!emailValido(email)) return res.status(400).json({ success: false, message: 'E-mail inválido' });
    if (!senhaValida(senha)) return res.status(400).json({ success: false, message: 'Senha deve ter no mínimo 8 caracteres, com letras e números' });

    const existing = await db.get('SELECT id FROM candidatos WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const result    = await db.pool.query(
      `INSERT INTO candidatos (nome_completo, email, senha, telefone, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nome_completo, email, senhaHash, telefone || null, cidade || null, estado || null]
    );

    const candidatoId = result.rows[0].id;
    const token       = generateToken(candidatoId, 'candidato');

    res.status(201).json({
      success: true,
      message: 'Candidato cadastrado com sucesso',
      token,
      user: { id: candidatoId, nome: nome_completo, email, tipo: 'candidato' },
    });
  } catch (error) {
    console.error('Erro em registroCandidato:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// ── registroEmpresa ───────────────────────────────────────────────
const registroEmpresa = async (req, res) => {
  try {
    const nome   = sanitize(req.body.nome);
    const email  = sanitize(req.body.email)?.toLowerCase();
    const { senha } = req.body;
    const cnpj   = sanitize(req.body.cnpj);
    const telefone = sanitize(req.body.telefone);
    const cidade = sanitize(req.body.cidade);
    const estado = sanitize(req.body.estado);

    // Validações
    if (!nome) return res.status(400).json({ success: false, message: 'Nome da empresa é obrigatório' });
    if (!emailValido(email)) return res.status(400).json({ success: false, message: 'E-mail inválido' });
    if (!senhaValida(senha)) return res.status(400).json({ success: false, message: 'Senha deve ter no mínimo 8 caracteres, com letras e números' });

    const existing = await db.get('SELECT id FROM empresas WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ success: false, message: 'E-mail já cadastrado' });

    const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
    const result    = await db.pool.query(
      `INSERT INTO empresas (nome, email, senha, cnpj, telefone, cidade, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [nome, email, senhaHash, cnpj || null, telefone || null, cidade || null, estado || null]
    );

    const empresaId = result.rows[0].id;
    const token     = generateToken(empresaId, 'empresa');

    res.status(201).json({
      success: true,
      message: 'Empresa cadastrada com sucesso',
      token,
      user: { id: empresaId, nome, email, tipo: 'empresa' },
    });
  } catch (error) {
    console.error('Erro em registroEmpresa:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// ── login ─────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const email = sanitize(req.body.email)?.toLowerCase();
    const { senha, tipo } = req.body;

    // Validações básicas
    if (!emailValido(email)) return res.status(400).json({ success: false, message: 'E-mail inválido' });
    if (!senha)              return res.status(400).json({ success: false, message: 'Senha é obrigatória' });
    if (!['candidato', 'empresa'].includes(tipo))
      return res.status(400).json({ success: false, message: 'Tipo inválido' });

    const tabela    = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const nomeField = tipo === 'candidato' ? 'nome_completo' : 'nome';

    // FIX: seleciona apenas os campos necessários — nunca retorna dados extras
    const user = await db.get(
      `SELECT id, ${nomeField} AS nome, email, senha FROM ${tabela} WHERE email = $1`,
      [email]
    );

    // FIX: mensagem genérica — não revela se o e-mail existe ou não
    const INVALID_MSG = 'E-mail ou senha incorretos';
    if (!user) return res.status(401).json({ success: false, message: INVALID_MSG });

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return res.status(401).json({ success: false, message: INVALID_MSG });

    const token = generateToken(user.id, tipo);

    res.json({
      success: true,
      message: 'Login bem-sucedido',
      token,
      user: { id: user.id, nome: user.nome, email: user.email, tipo },
    });
  } catch (error) {
    console.error('Erro em login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// ── getProfile ────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const { id, tipo } = req.user;
    const tabela    = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const nomeField = tipo === 'candidato' ? 'nome_completo' : 'nome';

    // FIX: SELECT explícito — nunca vaza senha_hash ou outros campos sensíveis
    const user = await db.get(
      `SELECT id, ${nomeField} AS nome, email, telefone, cidade, estado FROM ${tabela} WHERE id = $1`,
      [id]
    );
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    res.json({ success: true, user: { ...user, tipo } });
  } catch (error) {
    console.error('Erro em getProfile:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// ── esqueceuSenha ─────────────────────────────────────────────────
const esqueceuSenha = async (req, res) => {
  try {
    const email = sanitize(req.body.email)?.toLowerCase();
    const { tipo } = req.body;

    if (!emailValido(email)) return res.status(400).json({ success: false, message: 'E-mail inválido' });
    if (!['candidato', 'empresa'].includes(tipo))
      return res.status(400).json({ success: false, message: 'Tipo inválido' });

    // Resposta sempre igual — não revela se email existe (anti-enumeração)
    const GENERIC_MSG = 'Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique também o spam.';

    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const user   = await db.get(`SELECT id FROM ${tabela} WHERE email = $1`, [email]);
    if (!user) return res.json({ success: true, message: GENERIC_MSG });

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db.pool.query(
      `UPDATE ${tabela} SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
      [token, expiry, user.id]
    );

    const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&tipo=${tipo}`;
    await enviarEmail({
      para:    email,
      assunto: 'Redefinição de senha - Conecta Lagoa',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1a3a8f">Redefinição de senha</h2>
          <p>Clique no botão abaixo para redefinir sua senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${link}" style="display:inline-block;background:#1a3a8f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
            Redefinir senha
          </a>
          <p style="color:#6b7280;font-size:13px">Se não foi você quem solicitou, ignore este e-mail. Sua senha não será alterada.</p>
        </div>
      `,
    });

    res.json({ success: true, message: GENERIC_MSG });
  } catch (error) {
    console.error('Erro em esqueceuSenha:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// ── redefinirSenha ────────────────────────────────────────────────
const redefinirSenha = async (req, res) => {
  try {
    const { token, tipo, novaSenha } = req.body;

    if (!['candidato', 'empresa'].includes(tipo))
      return res.status(400).json({ success: false, message: 'Tipo inválido' });

    // FIX: valida força da nova senha antes de aceitar
    if (!senhaValida(novaSenha))
      return res.status(400).json({ success: false, message: 'Nova senha deve ter no mínimo 8 caracteres, com letras e números' });

    const tabela = tipo === 'candidato' ? 'candidatos' : 'empresas';
    const user   = await db.get(
      `SELECT id FROM ${tabela} WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    if (!user) return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });

    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
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

module.exports = { registroCandidato, registroEmpresa, login, getProfile, esqueceuSenha, redefinirSenha };