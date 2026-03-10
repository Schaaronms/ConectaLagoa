// ── routes/rankingIA.js — Conecta Lagoa ──────────────────────
// Rota que chama a Claude API pelo backend (chave segura no .env)
// e retorna rankings de compatibilidade candidato × vaga.
//
// Endpoints:
//   POST /api/ranking-ia/por-vaga
//     body: { vagaId }
//     Retorna candidatos ranqueados para uma vaga específica.
//
//   POST /api/ranking-ia/candidatos-vagas
//     body: { vagaIds: [id, id, ...] }
//     Retorna scores de todos os candidatos × todas as vagas.
// ─────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-20250514';

// ── Helper: chama Claude e retorna JSON parseado ─────────────
async function chamarClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada no .env');

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro na API Claude');

  const text = (data.content || []).map(b => b.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── Helper: busca candidatos do banco ───────────────────────
async function buscarCandidatos(empresaId) {
  const result = await pool.query(`
    SELECT
      u.id,
      u.nome,
      u.cargo,
      u.area,
      u.cidade,
      u.habilidades,
      u.score_ia
    FROM usuarios u
    WHERE u.tipo = 'candidato'
    ORDER BY u.nome ASC
    LIMIT 20
  `);
  return result.rows;
}

// ── Helper: busca vagas da empresa ───────────────────────────
async function buscarVagas(empresaId, vagaIds) {
  let query = `
    SELECT id, titulo, descricao, area, tipo_contrato, requisitos
    FROM vagas
    WHERE empresa_id = $1 AND ativa = true
  `;
  const params = [empresaId];

  if (vagaIds && vagaIds.length > 0) {
    const placeholders = vagaIds.map((_, i) => `$${i + 2}`).join(', ');
    query += ` AND id IN (${placeholders})`;
    params.push(...vagaIds);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

// ── Formata candidato para o prompt ─────────────────────────
function formatarCandidato(c, idx) {
  const skills = Array.isArray(c.habilidades)
    ? c.habilidades.join(', ')
    : (c.habilidades || 'não informado');
  return `${idx + 1}. ${c.nome} — ${c.cargo || c.area || 'Candidato'}
   Skills: ${skills}
   Cidade: ${c.cidade || 'não informada'}`;
}

// ────────────────────────────────────────────────────────────
// POST /api/ranking-ia/por-vaga
// ────────────────────────────────────────────────────────────
router.post('/por-vaga', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { vagaId } = req.body;
    if (!vagaId) return res.status(400).json({ error: 'vagaId é obrigatório' });

    // Busca a vaga específica
    const vagaResult = await pool.query(
      'SELECT id, titulo, descricao, area, tipo_contrato, requisitos FROM vagas WHERE id = $1 AND empresa_id = $2',
      [vagaId, req.user.id]
    );
    if (vagaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vaga não encontrada' });
    }
    const vaga = vagaResult.rows[0];

    // Busca candidatos
    const candidatos = await buscarCandidatos(req.user.id);
    if (candidatos.length === 0) {
      return res.json({ ranking: [] });
    }

    const prompt = `Você é um sistema de RH com IA. Analise os candidatos abaixo e gere um ranking de compatibilidade com a vaga.

VAGA: ${vaga.titulo}
Área: ${vaga.area || 'não informada'}
Descrição: ${vaga.descricao || 'não informada'}
Requisitos: ${vaga.requisitos || 'não informados'}
Tipo: ${vaga.tipo_contrato || 'não informado'}

CANDIDATOS:
${candidatos.map(formatarCandidato).join('\n\n')}

Para cada candidato, retorne um JSON array ordenado do maior para o menor score:
[
  {
    "nome": "string — nome exato do candidato",
    "score": número de 0 a 100,
    "recomendacao": "string curta de 1 frase sobre por que é bom para a vaga",
    "traits": ["trait1", "trait2", "trait3"]
  }
]

Retorne APENAS o JSON array, sem markdown, sem explicação.`;

    const ranking = await chamarClaude(prompt);
    res.json({ ranking });

  } catch (err) {
    console.error('[RankingIA/por-vaga]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/ranking-ia/candidatos-vagas
// ────────────────────────────────────────────────────────────
router.post('/candidatos-vagas', authMiddleware, async (req, res) => {
  try {
    if (req.user.tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { vagaIds } = req.body;

    // Busca vagas e candidatos
    const [vagas, candidatos] = await Promise.all([
      buscarVagas(req.user.id, vagaIds),
      buscarCandidatos(req.user.id),
    ]);

    if (vagas.length === 0)      return res.json({ resultado: [] });
    if (candidatos.length === 0) return res.json({ resultado: [] });

    const prompt = `Você é um sistema de RH com IA. Para cada candidato, calcule a compatibilidade (0-100) com cada uma das vagas abertas.

VAGAS ABERTAS:
${vagas.map((v, i) => `- ID ${v.id}: ${v.titulo} | Área: ${v.area || 'n/a'} | Requisitos: ${v.requisitos || 'não informados'}`).join('\n')}

CANDIDATOS:
${candidatos.map(formatarCandidato).join('\n\n')}

Retorne um JSON array onde cada objeto representa um candidato:
[
  {
    "nome": "string — nome exato",
    "melhorVaga": id_numerico_da_vaga_com_maior_score,
    "dica": "1 frase curta sobre o perfil geral desse candidato",
    "vagas": {
      "ID_DA_VAGA": score_numerico,
      ...
    }
  }
]

Use os IDs numéricos exatos das vagas como chaves no objeto "vagas".
Retorne APENAS o JSON array, sem markdown, sem explicação.`;

    const resultado = await chamarClaude(prompt);
    res.json({ resultado });

  } catch (err) {
    console.error('[RankingIA/candidatos-vagas]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
