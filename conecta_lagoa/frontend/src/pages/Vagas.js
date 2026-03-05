import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Filters from './Filters';
import VagasGrid from './VagasGrid';
import { fetchVagas } from '../api/vagasApi';
import './Vagas.css';

export default function Vagas() {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    local: '', modelo: '', tipo: '', pcd: false,
  });

  useEffect(() => {
    const loadVagas = async () => {
      setLoading(true);
      try {
        const data = await fetchVagas({ search: searchTerm, ...filters });
        setVagas(data);
      } catch (error) {
        console.error('Erro ao carregar vagas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVagas();
  }, [searchTerm, filters]);

  return (
    <div className="vagas-page">

      {/* HERO */}
      <section className="vagas-hero">
        <div className="vagas-hero-grid" />
        <div className="vagas-hero-content">
          <div className="vagas-hero-badge">
            <div className="vagas-hero-badge-dot" />
            Vagas atualizadas diariamente
          </div>
          <h1>Encontre vagas em Lagoa da Prata e região</h1>
          <p>Plataforma #1 de empregos locais — conectando talentos com oportunidades reais</p>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </section>

      {/* FILTROS */}
      <Filters filters={filters} setFilters={setFilters} totalVagas={vagas.length} />

      {/* CONTEÚDO */}
      <section className="vagas-section">
        {loading ? (
          <div className="vagas-loading">
            <div className="vagas-spinner" />
            <p>Carregando vagas...</p>
          </div>
        ) : vagas.length === 0 ? (
          <div className="vagas-empty">
            <div className="vagas-empty-icon">🔍</div>
            <h2>Nenhuma vaga encontrada</h2>
            <p>Tente ajustar os filtros ou a busca. Estamos adicionando novas oportunidades todos os dias!</p>
            <button
              className="vagas-empty-btn"
              onClick={() => {
                setSearchTerm('');
                setFilters({ local: '', modelo: '', tipo: '', pcd: false });
              }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <VagasGrid vagas={vagas} />
        )}
      </section>
    </div>
  );
}
