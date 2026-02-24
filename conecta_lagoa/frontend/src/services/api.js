import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar 401 (logout automático)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  registroCandidato: (data) => api.post('/auth/registro/candidato', data),
  registroEmpresa: (data) => api.post('/auth/registro/empresa', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  esqueceuSenha: (data) => api.post('/auth/esqueceu-senha', data),
  redefinirSenha: (data) => api.post('/auth/redefinir-senha', data),
};

// ==================== CANDIDATOS ====================
export const candidatoAPI = {
  atualizarPerfil: (data) => api.put('/candidato/perfil', data),
  getPerfil: () => api.get('/candidato/perfil'),
  getPerfilById: (id) => api.get(`/candidato/${id}`),
  uploadCurriculo: (file) => {
    const formData = new FormData();
    formData.append('curriculo', file);
    return api.post('/candidato/curriculo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadFoto: (file) => {
    const formData = new FormData();
    formData.append('foto', file);
    return api.post('/candidato/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  adicionarExperiencia: (data) => api.post('/candidato/experiencia', data),
  adicionarFormacao: (data) => api.post('/candidato/formacao', data),
  adicionarHabilidade: (data) => api.post('/candidato/habilidade', data)
};

// ==================== EMPRESAS ====================
export const empresaAPI = {
  atualizarPerfil: (data) => api.put('/empresa/perfil', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/empresa/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  buscarCandidatos: (params) => api.get('/candidatos', { params }),
  visualizarCandidato: (id) => api.post(`/empresa/visualizar/${id}`),
  adicionarFavorito: (id, notas) => api.post(`/empresa/favorito/${id}`, { notas }),
  removerFavorito: (id) => api.delete(`/empresa/favorito/${id}`),
  listarFavoritos: () => api.get('/empresa/favoritos'),
  getHistorico: () => api.get('/empresa/historico'),
  getEstatisticas: () => api.get('/empresa/estatisticas')
};

export default api;