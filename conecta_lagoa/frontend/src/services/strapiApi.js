import axios from 'axios';

const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337';

const strapiApi = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para buscar artigos (Strapi v5 – flattened)
export const fetchArticles = async () => {
  try {
    const response = await strapiApi.get('/api/artigos?populate=*&sort=publishedAt:desc');
    
    console.log('Resposta completa do Strapi:', response.data); // debug
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar artigos do Strapi:', error.response?.data || error.message);
    return [];
  }
};

// Se precisar de mais funções do Strapi no futuro (ex: buscar um artigo específico)
// export const fetchArticleById = async (id) => { ... };

export default strapiApi;