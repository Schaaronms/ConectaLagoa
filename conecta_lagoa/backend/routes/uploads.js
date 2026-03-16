// routes/uploads.js — Conecta Lagoa
// Rotas: POST /api/usuarios/foto
//        POST /api/usuarios/curriculo
//
// Dependências necessárias (instale se não tiver):
//   npm install multer pdf-parse sharp uuid
//
// Em server.js adicione:
//   app.use('/api/usuarios', require('./routes/uploads'));
//   (pode ser junto com o arquivo usuarios.js já existente, ou separado)

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

const { pool }          = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// ─── diretórios de upload ────────────────────────────────────────────────────
const UPLOAD_DIR  = path.join(__dirname, '../uploads');
const FOTOS_DIR   = path.join(UPLOAD_DIR, 'fotos');
const CURRICULOS_DIR = path.join(UPLOAD_DIR, 'curriculos');

[UPLOAD_DIR, FOTOS_DIR, CURRICULOS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── multer: fotos ───────────────────────────────────────────────────────────
const storageFoto = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FOTOS_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const uploadFoto = multer({
  storage: storageFoto,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Apenas imagens são permitidas (JPG, PNG, WebP)'));
  },
});

// ─── multer: currículos PDF ──────────────────────────────────────────────────
const storagePdf = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CURRICULOS_DIR),
  filename:    (_req, file, cb) => cb(null, `${uuidv4()}.pdf`),
});
const uploadPdf = multer({
  storage: storagePdf,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Apenas arquivos PDF são permitidos'));
  },
});

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Extrai dados básicos do texto do PDF usando regex simples */
function extrairDadosPDF(texto) {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);

  // telefone: (XX) XXXXX-XXXX ou similar
  const telMatch = texto.match(/(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/);

  // LinkedIn
  const linkedinMatch = texto.match(/linkedin\.com\/in\/([^\s\/\"\']+)/i);

  // e-mail
  const emailMatch = texto.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);

  // cidade: heurística — linha que contém ' - ' ou '/' e parece ser localização
  // Ex: "Porto Alegre - RS" ou "Porto Alegre/RS"
  const cidadeMatch = texto.match(/([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)\s*[-\/]\s*([A-Z]{2})\b/);

  // nome: geralmente a primeira linha não-vazia com pelo menos 2 palavras e sem números
  const nomeCandidate = linhas.find(l =>
    /^[A-ZÀ-Úa-zà-ú]+ [A-ZÀ-Úa-zà-ú]/.test(l) && !/\d/.test(l) && l.length < 80
  );

  // resumo/objetivo: bloco após palavras-chave comuns
  let resumo = '';
  const resumoIdx = linhas.findIndex(l =>
    /^(resumo|objetivo|perfil|sobre mim|apresenta[cç][aã]o)/i.test(l)
  );
  if (resumoIdx !== -1) {
    resumo = linhas.slice(resumoIdx + 1, resumoIdx + 5).join(' ').slice(0, 500);
  }

  return {
    nome:      nomeCandidate || null,
    telefone:  telMatch      ? telMatch[1] : null,
    email:     emailMatch    ? emailMatch[0] : null,
    cidade:    cidadeMatch   ? cidadeMatch[1] : null,
    linkedin:  linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : null,
    resumo:    resumo        || null,
  };
}

// ─── POST /api/usuarios/foto ─────────────────────────────────────────────────
router.post('/foto', authMiddleware, uploadFoto.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhuma imagem recebida' });
    }

    // URL pública relativa ao servidor
    const foto_url = `/uploads/fotos/${req.file.filename}`;

    // Salva no banco (adicione a coluna se não existir: ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT)
    await pool.query(
      'UPDATE usuarios SET foto_url = $1 WHERE id = $2',
      [foto_url, req.user.id]
    );

    // Remove foto antiga se existir (evita acúmulo de arquivos)
    const anterior = await pool.query('SELECT foto_url FROM usuarios WHERE id = $1', [req.user.id]);
    if (anterior.rows[0]?.foto_url) {
      const oldPath = path.join(__dirname, '..', anterior.rows[0].foto_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    res.json({ success: true, foto_url, message: 'Foto atualizada com sucesso' });

  } catch (err) {
    console.error('[POST /usuarios/foto]', err.message);
    // limpa arquivo em caso de erro
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Erro ao salvar foto' });
  }
});

// ─── POST /api/usuarios/curriculo ────────────────────────────────────────────
router.post('/curriculo', authMiddleware, uploadPdf.single('curriculo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum PDF recebido' });
    }

    // Lê e parseia o PDF
    let dados = null;
    let textoExtraido = '';
    try {
      const pdfParse = require('pdf-parse');
      const buffer   = fs.readFileSync(req.file.path);
      const parsed   = await pdfParse(buffer);
      textoExtraido  = parsed.text || '';
      dados          = extrairDadosPDF(textoExtraido);
    } catch (parseErr) {
      // Se pdf-parse falhar, ainda salva o arquivo mas sem dados extraídos
      console.warn('[curriculo] Falha ao parsear PDF:', parseErr.message);
    }

    // Salva caminho do PDF no banco
    // ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS curriculo_url TEXT;
    const curriculo_url = `/uploads/curriculos/${req.file.filename}`;
    await pool.query(
      'UPDATE usuarios SET curriculo_url = $1 WHERE id = $2',
      [curriculo_url, req.user.id]
    );

    // Se extraiu dados, preenche os campos ainda vazios no banco
    if (dados) {
      const updates = [];
      const params  = [];
      let   idx     = 1;

      const mapCampos = {
        nome:    dados.nome,
        telefone: dados.telefone,
        email:   dados.email,
        cidade:  dados.cidade,
        sobre_mim: dados.resumo,
        linkedin_url: dados.linkedin,
      };

      // Só atualiza campos que estão atualmente vazios (não sobrescreve o que o usuário preencheu)
      const atual = await pool.query(
        'SELECT nome, telefone, email, cidade, sobre_mim, linkedin_url FROM usuarios WHERE id = $1',
        [req.user.id]
      );
      const row = atual.rows[0] || {};

      for (const [col, valor] of Object.entries(mapCampos)) {
        if (valor && !row[col]) {         // só preenche se o campo estiver vazio
          updates.push(`${col} = $${idx++}`);
          params.push(valor);
        }
      }

      if (updates.length) {
        params.push(req.user.id);
        await pool.query(
          `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${idx}`,
          params
        );
      }
    }

    res.json({
      success: true,
      curriculo_url,
      dados,
      msg: dados
        ? `Dados extraídos: ${[dados.nome, dados.telefone, dados.cidade].filter(Boolean).join(' · ')}`
        : 'PDF salvo, mas não foi possível extrair dados automaticamente.',
    });

  } catch (err) {
    console.error('[POST /usuarios/curriculo]', err.message);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Erro ao processar currículo' });
  }
});

module.exports = router;
