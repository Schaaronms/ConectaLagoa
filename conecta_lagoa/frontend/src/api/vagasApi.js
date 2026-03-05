// src/api/vagasApi.js
// Versão híbrida: tenta a API real primeiro, usa mocks como fallback
// Mantém a mesma lógica de filtros do original

const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';

// ─── Mocks (seus dados originais de teste) ────────────────────────
const mockVagas = [
  {
    id: 1,
    titulo: "Auxiliar de Produção",
    empresa_nome: "Indústria Alimentícia LTDA",
    local: "Lagoa Vermelha, RS",
    modelo: "presencial",
    tipo: "CLT", tipo_contrato: "CLT",
    salario: "R$ 1.800 - R$ 2.200",
    descricao: "Atuação na linha de produção, controle de qualidade e embalagem de produtos alimentícios. Escala 6x1.",
    descricaoCompleta: "Responsabilidades:\n- Operar máquinas simples\n- Separar e embalar produtos\n- Manter limpeza do posto de trabalho\nRequisitos:\n- Ensino fundamental completo\n- Disponibilidade de horário",
    pcd: false, ativa: true,
  },
  {
    id: 2,
    titulo: "Vendedor Externo",
    empresa_nome: "Distribuidora ABC",
    local: "Lagoa Vermelha e região",
    modelo: "hibrido",
    tipo: "PJ", tipo_contrato: "PJ",
    salario: "R$ 2.500 + comissão",
    descricao: "Prospecção e atendimento a clientes da região. Carteira de moto e CNH B obrigatórias.",
    descricaoCompleta: "Atividades:\n- Visitar clientes\n- Fechar vendas\nRequisitos:\n- Experiência em vendas\n- Veículo próprio\nBenefícios: Comissão atrativa + vale combustível",
    pcd: false, ativa: true,
  },
  {
    id: 3,
    titulo: "Recepcionista Bilíngue",
    empresa_nome: "Hotel & Turismo",
    local: "Passo Fundo, RS",
    modelo: "presencial",
    tipo: "CLT", tipo_contrato: "CLT",
    salario: "R$ 2.000 + benefícios",
    descricao: "Atendimento ao público, reservas e suporte administrativo. Necessário inglês intermediário.",
    descricaoCompleta: "Funções:\n- Receber hóspedes\n- Gerenciar check-in/out\nRequisitos:\n- Inglês conversação\n- Boa apresentação",
    pcd: true, ativa: true,
  },
];

// ─── Filtro local (igual ao seu original) ────────────────────────
function filtrarMocks(vagas, params) {
  let filtered = [...vagas];

  if (params.search?.trim()) {
    const term = params.search.toLowerCase().trim();
    filtered = filtered.filter(v =>
      v.titulo.toLowerCase().includes(term) ||
      v.empresa_nome?.toLowerCase().includes(term) ||
      v.descricao?.toLowerCase().includes(term) ||
      v.descricaoCompleta?.toLowerCase().includes(term)
    );
  }
  if (params.local)
    filtered = filtered.filter(v => v.local?.toLowerCase().includes(params.local.toLowerCase()));
  if (params.modelo)
    filtered = filtered.filter(v => v.modelo === params.modelo);
  if (params.tipo)
    filtered = filtered.filter(v => (v.tipo_contrato || v.tipo) === params.tipo);
  if (params.pcd === true || params.pcd === 'true')
    filtered = filtered.filter(v => v.pcd === true);

  return filtered;
}

// ─── fetchVagas principal ─────────────────────────────────────────
export const fetchVagas = async (params = {}) => {
  // Tenta API real primeiro
  try {
    const qs = new URLSearchParams();
    if (params.search)  { qs.set('search', params.search); qs.set('busca', params.search); }
    if (params.local)     qs.set('local',         params.local);
    if (params.modelo)    qs.set('modelo',         params.modelo);
    if (params.tipo)      qs.set('tipo_contrato',  params.tipo);
    if (params.pcd)       qs.set('pcd',            'true');

    const res = await fetch(`${BASE}/vagas${qs.toString() ? '?' + qs.toString() : ''}`, {
      signal: AbortSignal.timeout(5000), // timeout de 5s — não trava o usuário
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data  = await res.json();
    const lista = Array.isArray(data) ? data : (data.data ?? data.vagas ?? []);

    // Se a API retornou resultados, usa eles
    if (lista.length >= 0) {
      return lista.filter(v => v.ativa !== false);
    }
  } catch (err) {
    // API offline ou erro → cai nos mocks silenciosamente
    console.warn('[vagasApi] API indisponível, usando dados mock:', err.message);
  }

  // Fallback: mocks com filtro local (igual ao seu original)
  await new Promise(r => setTimeout(r, 400)); // simula delay
  return filtrarMocks(mockVagas, params);
};

export async function fetchVagaById(id) {
  try {
    const res = await fetch(`${BASE}/vagas/${id}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    // Fallback nos mocks
    return mockVagas.find(v => v.id === Number(id)) || null;
  }
}