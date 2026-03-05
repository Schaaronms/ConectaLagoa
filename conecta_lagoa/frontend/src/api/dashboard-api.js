// ============================================================
// dashboard-api.js — Camada de serviço do Conecta Lagoa
// Conecta todos os endpoints do backend Express + PostgreSQL
// ============================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';

// ── Token JWT (salvo no login) ──────────────────────────────
const getToken = () => localStorage.getItem('cl_token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// ── Helper de fetch com tratamento de erro ──────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...options.headers },
  });

  if (res.status === 401) {
    localStorage.removeItem('cl_token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
}

// ============================================================
// AUTH
// ============================================================
export const authService = {
  login: (email, senha) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),

  registroEmpresa: (dados) =>
    apiFetch('/auth/registro/empresa', { method: 'POST', body: JSON.stringify(dados) }),

  registroCandidato: (dados) =>
    apiFetch('/auth/registro/candidato', { method: 'POST', body: JSON.stringify(dados) }),

  getProfile: () => apiFetch('/auth/profile'),

  esqueceuSenha: (email) =>
    apiFetch('/auth/esqueceu-senha', { method: 'POST', body: JSON.stringify({ email }) }),

  redefinirSenha: (token, novaSenha) =>
    apiFetch('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha }) }),
};

// ============================================================
// DASHBOARD — carrega todos os dados em paralelo
// ============================================================
export const dashboardService = {
  carregarDadosCompletos: async () => {
    const [resumo, grafico, areas, vagasMes, candidatosRecentes] = await Promise.all([
      apiFetch('/dashboard/resumo'),
      apiFetch('/dashboard/grafico-candidaturas'),
      apiFetch('/dashboard/vagas-por-area'),
      apiFetch('/dashboard/vagas-por-mes'),
      apiFetch('/dashboard/candidatos-recentes'),
    ]);
    return { resumo, grafico, areas, vagasMes, candidatosRecentes };
  },

  getResumo:              () => apiFetch('/dashboard/resumo'),
  getGrafico:             () => apiFetch('/dashboard/grafico-candidaturas'),
  getAreaDistribuicao:    () => apiFetch('/dashboard/vagas-por-area'),
  getVagasPorMes:         () => apiFetch('/dashboard/vagas-por-mes'),
  getCandidatosRecentes:  () => apiFetch('/dashboard/candidatos-recentes'),
};

// ============================================================
// EMPRESA
// ============================================================
export const empresaService = {
  getMeuPerfil:       () => apiFetch('/empresa/meu-perfil'),
  getPerfilPorId:     (id) => apiFetch(`/empresa/${id}`),
  atualizarPerfil:    (dados) => apiFetch('/empresa/perfil', { method: 'PUT', body: JSON.stringify(dados) }),

  listarVagas:        () => apiFetch('/empresa/vagas'),
  criarVaga:          (dados) => apiFetch('/empresa/vagas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarVaga:      (id, dados) => apiFetch(`/empresa/vagas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluirVaga:        (id) => apiFetch(`/empresa/vagas/${id}`, { method: 'DELETE' }),

  getEstatisticas:          () => apiFetch('/empresa/estatisticas'),
  candidatosPorVaga:        () => apiFetch('/empresa/candidatos-vagas'),
  candidatosAtivos:         () => apiFetch('/empresa/candidatos-ativos'),
  candidatosContratados:    () => apiFetch('/empresa/candidatos-contratados'),
  historicoVisualizacoes:   () => apiFetch('/empresa/historico-visualizacoes'),

  listarFavoritos:    () => apiFetch('/empresa/favoritos'),
  adicionarFavorito:  (id) => apiFetch(`/empresa/favorito/${id}`, { method: 'POST' }),
  removerFavorito:    (id) => apiFetch(`/empresa/favorito/${id}`, { method: 'DELETE' }),
  visualizarCandidato:(id) => apiFetch(`/empresa/visualizar/${id}`, { method: 'POST' }),
  buscarCandidatos:   (filtros) => {
    const params = new URLSearchParams(filtros).toString();
    return apiFetch(`/candidatos?${params}`);
  },
};

// ============================================================
// CANDIDATO
// ============================================================
export const candidatoService = {
  getMeuPerfil:       () => apiFetch('/candidato/meu-perfil'),
  getPerfilPorId:     (id) => apiFetch(`/candidato/${id}`),
  atualizarPerfil:    (dados) => apiFetch('/candidato/perfil', { method: 'PUT', body: JSON.stringify(dados) }),

  adicionarExperiencia: (dados) => apiFetch('/candidato/experiencia', { method: 'POST', body: JSON.stringify(dados) }),
  adicionarFormacao:    (dados) => apiFetch('/candidato/formacao', { method: 'POST', body: JSON.stringify(dados) }),
  adicionarHabilidade:  (dados) => apiFetch('/candidato/habilidade', { method: 'POST', body: JSON.stringify(dados) }),

  uploadCurriculo: (file) => {
    const form = new FormData();
    form.append('curriculo', file);
    return fetch(`${BASE_URL}/candidato/curriculo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(r => r.json());
  },

  uploadFoto: (file) => {
    const form = new FormData();
    form.append('foto', file);
    return fetch(`${BASE_URL}/candidato/foto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(r => r.json());
  },
};

export default { authService, dashboardService, empresaService, candidatoService,  };
