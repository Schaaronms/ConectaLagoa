// dashboard-api.js (VERSÃO REACT)
// =====================================================
// Apenas lógica de dados. Sem manipulação de DOM/HTML.
// =====================================================

const API_URL = 'https://conectalagoa.onrender.com/api';

export const Auth = {
    getToken: () => localStorage.getItem('cl_token'),
    setToken: (token) => localStorage.setItem('cl_token', token),
    getEmpresa: () => JSON.parse(localStorage.getItem('cl_empresa') || 'null'),
    setEmpresa: (empresa) => localStorage.setItem('cl_empresa', JSON.stringify(empresa)),
    logout: () => {
        localStorage.removeItem('cl_token');
        localStorage.removeItem('cl_empresa');
        window.location.href = '/login'; 
    }
};

export async function apiFetch(path, options = {}) {
    const token = Auth.getToken();
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401 || res.status === 403) {
        Auth.logout();
        return null;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
    return data;
}

export const dashboardService = {
    carregarDadosCompletos: async () => {
        try {
            const [resumo, grafico, areas, vagasMes, candidatosRecentes] = await Promise.all([
                apiFetch('/dashboard/resumo'),
                apiFetch('/dashboard/grafico-candidaturas'),
                apiFetch('/dashboard/vagas-por-area'),
                apiFetch('/dashboard/vagas-por-mes'),
                apiFetch('/dashboard/candidatos-recentes'),
            ]);
            return { resumo, grafico, areas, vagasMes, candidatosRecentes };
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
            throw err;
        }
    }
};