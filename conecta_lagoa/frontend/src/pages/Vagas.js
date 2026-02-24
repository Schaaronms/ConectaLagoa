// src/pages/Vagas.jsx
import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Filters from './Filters';
import VagasGrid from './VagasGrid';
import { fetchVagas } from '../api/vagasApi';

export default function Vagas() {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    local: '',
    modelo: '',
    tipo: '',
    pcd: false,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/40 font-sora">
      {/* Hero / Cabeçalho */}
      <section className="relative bg-gradient-to-br from-[#0d1f5c] via-[#1a3a8f] to-[#e07b00] text-white py-20 md:py-28 overflow-hidden">
        {/* Overlay decorativo sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12)_0%,transparent_60%),radial-gradient(circle_at_80%_70%,rgba(224,123,0,0.18)_0%,transparent_60%)]" />

        <div className="relative container mx-auto px-6 text-center max-w-5xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-lg">
            Encontre vagas em Lagoa Vermelha e região
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-12 max-w-3xl mx-auto">
            Plataforma #1 de empregos locais – vagas atualizadas diariamente
          </p>

          <div className="max-w-3xl mx-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={() => {}}
              className="w-full max-w-2xl mx-auto" // para centralizar melhor
            />
          </div>
        </div>
      </section>

      {/* Filtros - sticky no topo com blur */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <Filters 
            filters={filters} 
            setFilters={setFilters} 
            totalVagas={vagas.length} 
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <section className="container mx-auto px-6 py-12 md:py-16 max-w-7xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-2xl font-medium text-gray-700">Carregando vagas...</p>
            <p className="text-gray-500 mt-3">Aguarde um momento</p>
          </div>
        ) : vagas.length === 0 ? (
          <div className="text-center py-40 bg-white/70 rounded-2xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-5">
              Nenhuma vaga encontrada
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Tente ajustar os filtros ou a busca. Estamos adicionando novas oportunidades todos os dias!
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilters({ local: '', modelo: '', tipo: '', pcd: false });
              }}
              className="px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-orange-600 transition shadow-lg"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <VagasGrid vagas={vagas} />
          </div>
        )}
      </section>
    </div>
  );
}