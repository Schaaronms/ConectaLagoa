import React, { useState, useEffect, useCallback } from 'react';
import { empresaAPI } from '../services/api';
import './Dashboard.css';

const EmpresaDashboard = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    cidade: '',
    estado: '',
    page: 1
  });

  // ✅ FIX 1 e 2: useCallback garante que a função não muda a cada render
  const loadDados = useCallback(async () => {
    try {
      const [candidatosRes, estatRes] = await Promise.all([
        empresaAPI.buscarCandidatos(searchParams),
        empresaAPI.getEstatisticas()
      ]);

      setCandidatos(candidatosRes.data.candidatos);
      setEstatisticas(estatRes.data.estatisticas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // ✅ FIX 1: useEffect vem depois da declaração da função
  useEffect(() => {
    loadDados();
  }, [loadDados]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await empresaAPI.buscarCandidatos(searchParams);
      setCandidatos(response.data.candidatos);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value
    });
  };

  const visualizarCandidato = async (candidatoId) => {
    try {
      await empresaAPI.visualizarCandidato(candidatoId);
      window.open(`/candidato/${candidatoId}`, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar:', error);
    }
  };

  // ✅ FIX 3: toggleFavorito agora é usado no botão de favorito no card
  const toggleFavorito = async (candidatoId, isFavorito) => {
    try {
      if (isFavorito) {
        await empresaAPI.removerFavorito(candidatoId);
      } else {
        await empresaAPI.adicionarFavorito(candidatoId);
      }
      loadDados();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };

  if (loading && !candidatos.length) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Buscar Talentos</h1>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👁️</div>
              <div className="stat-info">
                <h3>{estatisticas.total_visualizacoes}</h3>
                <p>Visualizações</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <h3>{estatisticas.total_favoritos}</h3>
                <p>Favoritos</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros de Busca */}
        <div className="card">
          <form onSubmit={handleSearch} className="search-form">
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={searchParams.cidade}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  name="estado"
                  value={searchParams.estado}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Todos</option>
                  <option value="SP">SP</option>
                  <option value="RJ">RJ</option>
                  <option value="MG">MG</option>
                  <option value="RS">RS</option>
                  <option value="BA">BA</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button type="submit" className="btn btn-primary btn-full">
                  Buscar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Lista de Candidatos */}
        <div className="candidatos-grid">
          {candidatos.length > 0 ? (
            candidatos.map((candidato) => (
              <div key={candidato.id} className="candidato-card">
                <div className="candidato-header">
                  {candidato.foto_url ? (
                    <img
                      src={`http://localhost:5000${candidato.foto_url}`}
                      alt={candidato.nome_completo}
                      className="candidato-foto"
                    />
                  ) : (
                    <div className="candidato-foto-placeholder">
                      👤
                    </div>
                  )}
                  <div>
                    <h3>{candidato.nome_completo}</h3>
                    <p className="candidato-local">
                      📍 {candidato.cidade}, {candidato.estado}
                    </p>
                  </div>
                </div>

                {candidato.sobre_mim && (
                  <p className="candidato-sobre">
                    {candidato.sobre_mim.substring(0, 150)}
                    {candidato.sobre_mim.length > 150 ? '...' : ''}
                  </p>
                )}

                <div className="candidato-info">
                  <span>📧 {candidato.email}</span>
                  {candidato.telefone && <span>📱 {candidato.telefone}</span>}
                </div>

                <div className="candidato-actions">
                  <button
                    onClick={() => visualizarCandidato(candidato.id)}
                    className="btn btn-primary"
                  >
                    Ver Perfil Completo
                  </button>

                  {/* ✅ FIX 3: botão de favorito agora usa toggleFavorito */}
                  <button
                    onClick={() => toggleFavorito(candidato.id, candidato.is_favorito)}
                    className="btn btn-outline"
                  >
                    {candidato.is_favorito ? '⭐ Desfavoritar' : '☆ Favoritar'}
                  </button>

                  {candidato.curriculo_url && (
                    <a
                      href={`http://localhost:5000${candidato.curriculo_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      📄 Currículo
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Nenhum candidato encontrado com os filtros selecionados.</p>
              <p className="text-muted">Tente ajustar os critérios de busca.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmpresaDashboard;