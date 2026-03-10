// middleware/auth.js — Conecta Lagoa
// FIXES:
//  1. req.user agora inclui empresa_id quando tipo=empresa
//     → elimina o bug "req.user.empresa_id || req.user.id" nos controllers
//  2. Token expirado retorna { expired: true } para o frontend poder agir
//  3. authMiddlewareStrict disponível para rotas críticas (verifica BD)
const jwt   = require('jsonwebtoken');
const { pool } = require('../config/db');

// ── authMiddleware ────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ success: false, message: 'Token não fornecido' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
      return res.status(401).json({ success: false, message: 'Token mal formatado' });

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);

    // FIX: empresa_id explícito — elimina "req.user.empresa_id || req.user.id"
    req.user = {
      id:         decoded.id,
      tipo:       decoded.tipo,
      empresa_id: decoded.tipo === 'empresa' ? decoded.id : undefined,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, message: 'Token expirado', expired: true });
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// ── authMiddlewareStrict — verifica se usuário ainda existe no BD ─
// Use em rotas críticas. Tem custo de 1 query extra por request.
const authMiddlewareStrict = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ success: false, message: 'Token não fornecido' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
      return res.status(401).json({ success: false, message: 'Token mal formatado' });

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    const tabela  = decoded.tipo === 'empresa' ? 'empresas' : 'candidatos';

    const { rows } = await pool.query(
      `SELECT id FROM ${tabela} WHERE id = $1 LIMIT 1`,
      [decoded.id]
    );
    if (!rows[0])
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });

    req.user = {
      id:         decoded.id,
      tipo:       decoded.tipo,
      empresa_id: decoded.tipo === 'empresa' ? decoded.id : undefined,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, message: 'Token expirado', expired: true });
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// ── Guards de tipo ────────────────────────────────────────────────
const isEmpresa = (req, res, next) => {
  if (req.user?.tipo !== 'empresa')
    return res.status(403).json({ success: false, message: 'Acesso negado: apenas empresas' });
  next();
};

const isCandidato = (req, res, next) => {
  if (req.user?.tipo !== 'candidato')
    return res.status(403).json({ success: false, message: 'Acesso negado: apenas candidatos' });
  next();
};

module.exports = { authMiddleware, authMiddlewareStrict, isEmpresa, isCandidato };