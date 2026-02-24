const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Token mal formatado' });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.id, tipo: decoded.tipo };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
};

const isEmpresa = (req, res, next) => {
  if (req.user?.tipo !== 'empresa') {
    return res.status(403).json({ success: false, message: 'Acesso negado: apenas empresas podem acessar este recurso' });
  }
  next();
}
const isCandidato = (req, res, next) => {
  if (req.user?.tipo !== 'candidato') {
    return res.status(403).json({ success: false, message: 'Acesso negado: apenas candidatos podem acessar este recurso' });
  }
  next();
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.empresa = decoded; // { id, nome, email, plano }
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
  }
}
module.exports = { authMiddleware, isEmpresa, isCandidato };
