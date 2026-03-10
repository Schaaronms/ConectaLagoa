// controllers/iaController.js — Conecta Lagoa
// ============================================================
// Centraliza toda a lógica de IA:
//  1. scoreIA()          — score real por matching de skills + requisitos
//  2. triagemAutomatica() — resumo + pontos fortes + recomendação ao candidatar
//  3. gerarDescricaoVaga() — gera vaga completa a partir de prompt livre
//  4. gerarPerguntasTriagem() — 5 perguntas específicas por vaga
//  5. gerarRelatorioContratacao() — PDF/HTML com timeline do processo
// ============================================================

const { pool } = require('../config/db');

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-20250514';

// ── Helper: chama Claude e retorna JSON ──────────────────────
async function chamarClaude(systemPrompt, userPrompt, maxTokens = 1500) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro na API Claude');

  const text = (data.content || []).map(b => b.text || '').join('');
  return text;
}

async function chamarClaudeJSON(systemPrompt, userPrompt, maxTokens = 1500) {
  const text = await chamarClaude(systemPrompt, userPrompt, maxTokens);
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    // tenta extrair JSON de dentro do texto
    const match = clean.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) return JSON.parse(match[1]);
    throw new Error('IA retornou resposta fora do formato JSON esperado');
  }
}

// ── 1. SCORE IA REAL ─────────────────────────────────────────────
// Algoritmo híbrido: regras pontuadas (não precisa de embeddings/OpenAI)
// Score = skills_match(40%) + experiencia(30%) + senioridade(20%) + localizacao(10%)
//
// POST /api/ia/score
// body: { candidato_id, vaga_id }

const calcularScore = async (req, res) => {
  try {
    const { candidato_id, vaga_id } = req.body;
    if (!candidato_id || !vaga_id)
      return res.status(400).json({ success: false, message: 'candidato_id e vaga_id são obrigatórios' });

    // Verifica cache (válido por 24h)
    const cache = await pool.query(
      `SELECT score, breakdown FROM scores_ia_cache
       WHERE candidato_id = $1 AND vaga_id = $2
         AND calculado_em > NOW() - INTERVAL '24 hours'`,
      [candidato_id, vaga_id]
    );
    if (cache.rows[0]) {
      return res.json({ success: true, score: cache.rows[0].score, breakdown: cache.rows[0].breakdown, fromCache: true });
    }

    // Busca candidato e vaga
    const [candResult, vagaResult] = await Promise.all([
      pool.query(`SELECT skills_estruturadas, experiencia_anos, nivel_senioridade, cidade, estado FROM usuarios WHERE id = $1`, [candidato_id]),
      pool.query(`SELECT requisitos_estruturados, requisitos, cidade, estado FROM vagas WHERE id = $1`, [vaga_id]),
    ]);

    const cand = candResult.rows[0];
    const vaga = vagaResult.rows[0];
    if (!cand || !vaga) return res.status(404).json({ success: false, message: 'Candidato ou vaga não encontrados' });

    // Normaliza skills do candidato
    const skillsCandidato = Array.isArray(cand.skills_estruturadas)
      ? cand.skills_estruturadas.map(s => (typeof s === 'string' ? s : s.nome || '').toLowerCase())
      : [];

    // Normaliza requisitos da vaga (estruturados ou texto livre)
    let requisitosVaga = [];
    if (Array.isArray(vaga.requisitos_estruturados) && vaga.requisitos_estruturados.length > 0) {
      requisitosVaga = vaga.requisitos_estruturados.map(r =>
        (typeof r === 'string' ? r : r.nome || '').toLowerCase()
      );
    } else if (vaga.requisitos) {
      // texto livre → split por vírgula/newline
      requisitosVaga = vaga.requisitos
        .split(/[,\n;]+/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    }

    // ── Cálculo das dimensões ──────────────────────────────────

    // 1. Skills match (40 pts)
    let skillsScore = 0;
    if (requisitosVaga.length > 0 && skillsCandidato.length > 0) {
      const matches = requisitosVaga.filter(req =>
        skillsCandidato.some(skill =>
          skill.includes(req) || req.includes(skill)
        )
      ).length;
      skillsScore = Math.round((matches / requisitosVaga.length) * 40);
    } else {
      skillsScore = 20; // sem dados suficientes → neutro
    }

    // 2. Experiência (30 pts) — escala logarítmica
    const anos = cand.experiencia_anos || 0;
    const expScore = anos === 0 ? 5
      : anos <= 1 ? 15
      : anos <= 3 ? 22
      : anos <= 6 ? 27
      : 30;

    // 3. Senioridade (20 pts)
    const NIVEL_SCORE = { estagiario: 8, junior: 14, pleno: 18, senior: 20, especialista: 20 };
    const seniorScore = NIVEL_SCORE[cand.nivel_senioridade] ?? 14;

    // 4. Localização (10 pts)
    let localScore = 5; // padrão: remoto/desconhecido
    if (vaga.cidade && cand.cidade) {
      if (cand.cidade?.toLowerCase() === vaga.cidade?.toLowerCase()) localScore = 10;
      else if (cand.estado?.toLowerCase() === vaga.estado?.toLowerCase()) localScore = 7;
    }

    const scoreTotal = skillsScore + expScore + seniorScore + localScore;
    const breakdown  = { skills: skillsScore, experiencia: expScore, senioridade: seniorScore, localizacao: localScore };

    // Salva no cache e atualiza candidatura se existir
    await pool.query(
      `INSERT INTO scores_ia_cache (candidato_id, vaga_id, score, breakdown)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (candidato_id, vaga_id)
       DO UPDATE SET score = EXCLUDED.score, breakdown = EXCLUDED.breakdown, calculado_em = NOW()`,
      [candidato_id, vaga_id, scoreTotal, JSON.stringify(breakdown)]
    );

    // Atualiza score_ia na candidatura (se existir)
    await pool.query(
      `UPDATE candidaturas SET score_ia = $1 WHERE candidato_id = $2 AND vaga_id = $3`,
      [scoreTotal, candidato_id, vaga_id]
    );

    res.json({ success: true, score: scoreTotal, breakdown });
  } catch (err) {
    console.error('[IA/score]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. TRIAGEM AUTOMÁTICA ────────────────────────────────────────
// Chamada automaticamente ao candidatar-se (via hook em vagas.js)
// Também pode ser acionada manualmente pela empresa
//
// POST /api/ia/triagem
// body: { candidatura_id }

const triagemAutomatica = async (req, res) => {
  try {
    const { candidatura_id } = req.body;
    if (!candidatura_id)
      return res.status(400).json({ success: false, message: 'candidatura_id é obrigatório' });

    // Busca candidatura + candidato + vaga
    const result = await pool.query(`
      SELECT
        c.id,
        c.mensagem_candidato,
        c.triagem_feita_em,
        u.nome              AS candidato_nome,
        u.cargo             AS candidato_cargo,
        u.area              AS candidato_area,
        u.curriculo_texto,
        u.skills_estruturadas,
        u.experiencia_anos,
        u.nivel_senioridade,
        v.titulo            AS vaga_titulo,
        v.descricao         AS vaga_descricao,
        v.requisitos        AS vaga_requisitos,
        v.requisitos_estruturados,
        v.area              AS vaga_area
      FROM candidaturas c
      JOIN usuarios u ON c.candidato_id = u.id
      JOIN vagas    v ON c.vaga_id      = v.id
      WHERE c.id = $1
    `, [candidatura_id]);

    if (!result.rows[0])
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada' });

    const d = result.rows[0];

    // Já foi feito recentemente? (evita rechamada desnecessária)
    if (d.triagem_feita_em) {
      const horasPassadas = (Date.now() - new Date(d.triagem_feita_em)) / 36e5;
      if (horasPassadas < 48) {
        // Retorna do banco sem chamar a API
        return res.json({
          success: true,
          fromCache: true,
          triagem: {
            resumo:         d.triagem_resumo,
            pontos_fortes:  d.triagem_pontos_fortes,
            recomendacao:   d.triagem_recomendacao,
          }
        });
      }
    }

    const skillsTexto = Array.isArray(d.skills_estruturadas)
      ? d.skills_estruturadas.map(s => (typeof s === 'string' ? s : s.nome)).join(', ')
      : '';

    const system = `Você é um assistente de RH especialista em triagem de candidatos.
Analise o perfil do candidato em relação à vaga e retorne APENAS um JSON válido, sem markdown.`;

    const userPrompt = `
VAGA: ${d.vaga_titulo}
Área da vaga: ${d.vaga_area || 'não informada'}
Descrição: ${d.vaga_descricao || 'não informada'}
Requisitos: ${d.vaga_requisitos || 'não informados'}

CANDIDATO: ${d.candidato_nome}
Cargo/área: ${d.candidato_cargo || d.candidato_area || 'não informado'}
Nível: ${d.nivel_senioridade || 'não informado'}
Anos de experiência: ${d.experiencia_anos ?? 'não informado'}
Skills: ${skillsTexto || 'não informadas'}
Currículo: ${d.curriculo_texto ? d.curriculo_texto.slice(0, 1500) : 'não disponível'}
Mensagem do candidato: ${d.mensagem_candidato || 'nenhuma'}

Retorne SOMENTE este JSON:
{
  "resumo": "Resumo do perfil em exatamente 3 linhas, destacando experiência e diferenciais",
  "pontos_fortes": "Análise direta dos pontos fortes do candidato versus os requisitos da vaga",
  "recomendacao": "avançar" | "aguardar" | "descartar",
  "justificativa_recomendacao": "1 frase explicando a recomendação"
}`;

    const triagem = await chamarClaudeJSON(system, userPrompt, 800);

    // Valida recomendação
    const recValida = ['avançar', 'aguardar', 'descartar'].includes(triagem.recomendacao)
      ? triagem.recomendacao
      : 'aguardar';

    // Salva no banco
    await pool.query(
      `UPDATE candidaturas
       SET triagem_resumo      = $1,
           triagem_pontos_fortes = $2,
           triagem_recomendacao  = $3,
           triagem_feita_em    = NOW()
       WHERE id = $4`,
      [triagem.resumo, triagem.pontos_fortes, recValida, candidatura_id]
    );

    res.json({
      success: true,
      triagem: {
        resumo:         triagem.resumo,
        pontos_fortes:  triagem.pontos_fortes,
        recomendacao:   recValida,
        justificativa:  triagem.justificativa_recomendacao,
      }
    });
  } catch (err) {
    console.error('[IA/triagem]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. GERADOR DE DESCRIÇÃO DE VAGA ─────────────────────────────
// Empresa envia prompt livre → IA gera vaga completa estruturada
//
// POST /api/ia/gerar-vaga
// body: { prompt } ex: "dev backend Node.js pleno, remoto, 8k-12k"

const gerarDescricaoVaga = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 10)
      return res.status(400).json({ success: false, message: 'Descreva a vaga com pelo menos 10 caracteres' });

    const system = `Você é um especialista em recrutamento e employer branding brasileiro.
Gere descrições de vagas profissionais, atrativas e claras.
Retorne APENAS JSON válido, sem markdown nem explicações.`;

    const userPrompt = `
Com base nesta descrição informal, gere uma vaga de emprego completa e profissional:
"${prompt}"

Retorne SOMENTE este JSON (em português):
{
  "titulo": "título profissional da vaga",
  "area": "área de atuação",
  "tipo_contrato": "CLT" | "PJ" | "Estágio" | "Freelance",
  "modalidade": "Presencial" | "Remoto" | "Híbrido",
  "descricao": "Descrição completa e atrativa da vaga, 3-4 parágrafos",
  "requisitos": "Lista de requisitos técnicos e comportamentais, formatada com • para cada item",
  "requisitos_estruturados": ["skill1", "skill2", "skill3"],
  "salario_sugerido": "faixa salarial estimada ou null se não mencionada",
  "nivel_senioridade": "estagiario" | "junior" | "pleno" | "senior" | "especialista",
  "beneficios_sugeridos": ["benefício 1", "benefício 2"]
}`;

    const vaga = await chamarClaudeJSON(system, userPrompt, 1200);

    res.json({ success: true, vaga });
  } catch (err) {
    console.error('[IA/gerar-vaga]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 4. PERGUNTAS DE TRIAGEM ──────────────────────────────────────
// Gera 5 perguntas personalizadas para a vaga
// Empresa aprova → candidato responde ao se candidatar
//
// POST /api/ia/perguntas-triagem
// body: { vaga_id }
//
// POST /api/ia/perguntas-triagem/aprovar
// body: { vaga_id, perguntas: [...] }

const gerarPerguntasTriagem = async (req, res) => {
  try {
    const { vaga_id } = req.body;
    if (!vaga_id)
      return res.status(400).json({ success: false, message: 'vaga_id é obrigatório' });

    // Verifica se a vaga pertence à empresa
    const vagaResult = await pool.query(
      `SELECT titulo, descricao, area, requisitos FROM vagas WHERE id = $1 AND empresa_id = $2`,
      [vaga_id, req.user.empresa_id]
    );
    if (!vagaResult.rows[0])
      return res.status(404).json({ success: false, message: 'Vaga não encontrada' });

    const vaga = vagaResult.rows[0];

    const system = `Você é um especialista em seleção de pessoas.
Crie perguntas de triagem inteligentes, específicas e reveladoras para cada vaga.
Retorne APENAS JSON válido.`;

    const userPrompt = `
Crie 5 perguntas de triagem para esta vaga:

Vaga: ${vaga.titulo}
Área: ${vaga.area || 'não informada'}
Descrição: ${vaga.descricao || 'não informada'}
Requisitos: ${vaga.requisitos || 'não informados'}

As perguntas devem:
- Ser específicas para ESTA vaga (não genéricas)
- Revelar competências técnicas E comportamentais
- Ter respostas que ajudem a diferenciar candidatos
- Mix de abertas e fechadas
- Em português do Brasil

Retorne SOMENTE este JSON:
[
  {
    "id": 1,
    "pergunta": "texto da pergunta",
    "tipo": "aberta" | "escolha_multipla" | "escala",
    "opcoes": ["opção 1", "opção 2"] // apenas se tipo for escolha_multipla, senão null
  }
]`;

    const perguntas = await chamarClaudeJSON(system, userPrompt, 1000);

    res.json({ success: true, perguntas, vaga_id });
  } catch (err) {
    console.error('[IA/perguntas]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const aprovarPerguntasTriagem = async (req, res) => {
  try {
    const { vaga_id, perguntas } = req.body;
    if (!vaga_id || !Array.isArray(perguntas))
      return res.status(400).json({ success: false, message: 'vaga_id e perguntas são obrigatórios' });

    // Verifica ownership
    const check = await pool.query(
      `SELECT id FROM vagas WHERE id = $1 AND empresa_id = $2`,
      [vaga_id, req.user.empresa_id]
    );
    if (!check.rows[0])
      return res.status(403).json({ success: false, message: 'Vaga não pertence à sua empresa' });

    await pool.query(
      `UPDATE vagas SET perguntas_triagem = $1, perguntas_status = 'aprovado' WHERE id = $2`,
      [JSON.stringify(perguntas), vaga_id]
    );

    res.json({ success: true, message: 'Perguntas aprovadas e publicadas na vaga' });
  } catch (err) {
    console.error('[IA/aprovar-perguntas]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 5. RELATÓRIO DE CONTRATAÇÃO ──────────────────────────────────
// Gerado ao contratar alguém (stage = 5 / Aprovado)
// Inclui timeline, pontuações, entrevistas, triagem IA
//
// POST /api/ia/relatorio-contratacao
// body: { candidatura_id }

const gerarRelatorioContratacao = async (req, res) => {
  try {
    const { candidatura_id } = req.body;
    if (!candidatura_id)
      return res.status(400).json({ success: false, message: 'candidatura_id é obrigatório' });

    // Verifica se já existe
    const existente = await pool.query(
      `SELECT id, conteudo_html FROM relatorios_contratacao WHERE candidatura_id = $1`,
      [candidatura_id]
    );
    if (existente.rows[0]) {
      return res.json({ success: true, html: existente.rows[0].conteudo_html, fromCache: true });
    }

    // Busca todos os dados do processo
    const result = await pool.query(`
      SELECT
        c.id, c.status, c.stage, c.rating, c.notas, c.score_ia,
        c.created_at        AS data_candidatura,
        c.triagem_resumo,
        c.triagem_pontos_fortes,
        c.triagem_recomendacao,
        c.mensagem_candidato,
        u.nome              AS candidato_nome,
        u.email             AS candidato_email,
        u.cargo             AS candidato_cargo,
        u.cidade            AS candidato_cidade,
        u.skills_estruturadas,
        u.experiencia_anos,
        v.titulo            AS vaga_titulo,
        v.area              AS vaga_area,
        v.tipo_contrato,
        v.modalidade,
        e.nome              AS empresa_nome
      FROM candidaturas c
      JOIN usuarios u ON c.candidato_id = u.id
      JOIN vagas    v ON c.vaga_id      = v.id
      JOIN usuarios e ON v.empresa_id   = e.id
      WHERE c.id = $1 AND v.empresa_id = $2
    `, [candidatura_id, req.user.empresa_id]);

    if (!result.rows[0])
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada' });

    const d = result.rows[0];

    // Busca eventos de agenda relacionados
    const agenda = await pool.query(
      `SELECT titulo, data_hora, tipo, formato FROM agenda
       WHERE empresa_id = $1 AND candidato_id = (
         SELECT candidato_id FROM candidaturas WHERE id = $2
       )
       ORDER BY data_hora ASC`,
      [req.user.empresa_id, candidatura_id]
    );

    const entrevistas = agenda.rows;

    // Gera relatório via IA
    const system = `Você é um especialista em RH que gera relatórios profissionais de processo seletivo.
Gere em HTML limpo e profissional (sem <!DOCTYPE>, sem <html>/<head>/<body> — apenas o conteúdo interno).
Use inline styles. Escreva em português do Brasil.`;

    const skills = Array.isArray(d.skills_estruturadas)
      ? d.skills_estruturadas.map(s => (typeof s === 'string' ? s : s.nome)).join(', ')
      : 'não informadas';

    const userPrompt = `
Gere um relatório HTML profissional de contratação com estes dados:

EMPRESA: ${d.empresa_nome}
VAGA: ${d.vaga_titulo} (${d.vaga_area || ''} | ${d.tipo_contrato || ''} | ${d.modalidade || ''})

CANDIDATO: ${d.candidato_nome}
E-mail: ${d.candidato_email}
Cargo atual: ${d.candidato_cargo || 'não informado'}
Cidade: ${d.candidato_cidade || 'não informada'}
Skills: ${skills}
Anos de experiência: ${d.experiencia_anos ?? 'não informado'}

PROCESSO:
- Data candidatura: ${new Date(d.data_candidatura).toLocaleDateString('pt-BR')}
- Score IA: ${d.score_ia ?? 'não calculado'}/100
- Avaliação da empresa: ${d.rating ? d.rating + '/5 estrelas' : 'não avaliado'}
- Notas do processo: ${d.notas || 'nenhuma'}
- Triagem IA — Resumo: ${d.triagem_resumo || 'não realizada'}
- Triagem IA — Pontos fortes: ${d.triagem_pontos_fortes || ''}
- Recomendação IA: ${d.triagem_recomendacao || 'não realizada'}

ENTREVISTAS REALIZADAS:
${entrevistas.length > 0
  ? entrevistas.map(e => `- ${new Date(e.data_hora).toLocaleDateString('pt-BR')} — ${e.titulo} (${e.tipo}/${e.formato})`).join('\n')
  : '- Nenhuma entrevista registrada no sistema'}

O relatório deve incluir:
1. Cabeçalho com logo placeholder, nome da empresa e data de geração
2. Resumo do candidato contratado
3. Timeline visual do processo (da candidatura até a contratação)
4. Score IA com breakdown se disponível
5. Destaques da triagem automática
6. Entrevistas realizadas
7. Notas e avaliação final
8. Seção de assinatura (espaço para rubrica)

Use paleta: azul escuro #1a3a8f, branco, cinza claro. Tipografia limpa. Bordas arredondadas.
O HTML deve ser auto-contido e pronto para imprimir.`;

    const htmlRelatorio = await chamarClaude(system, userPrompt, 3000);

    // Salva no banco
    await pool.query(
      `INSERT INTO relatorios_contratacao (empresa_id, candidatura_id, conteudo_html, conteudo_dados)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (candidatura_id) DO UPDATE
       SET conteudo_html = EXCLUDED.conteudo_html, gerado_em = NOW()`,
      [req.user.empresa_id, candidatura_id, htmlRelatorio, JSON.stringify(d)]
    );

    res.json({ success: true, html: htmlRelatorio });
  } catch (err) {
    console.error('[IA/relatorio]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  calcularScore,
  triagemAutomatica,
  gerarDescricaoVaga,
  gerarPerguntasTriagem,
  aprovarPerguntasTriagem,
  gerarRelatorioContratacao,
};
