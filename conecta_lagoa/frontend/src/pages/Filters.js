import { Briefcase, MapPin, Home, Users } from 'lucide-react';

export default function Filters({ filters, setFilters, totalVagas }) {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="text-sm text-gray-600 font-medium">
            {totalVagas} vagas encontradas
          </div>

          {/* Local */}
          <div className="relative min-w-[180px]">
            <select
              value={filters.local}
              onChange={e => handleChange('local', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Qualquer local</option>
              <option value="Lagoa Vermelha">Lagoa Vermelha</option>
              <option value="Passo Fundo">Passo Fundo</option>
              <option value="Erechim">Erechim</option>
              <option value="remoto">Remoto</option>
              <option value="outros">Outros</option>
            </select>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Modelo */}
          <div className="relative min-w-[180px]">
            <select
              value={filters.modelo}
              onChange={e => handleChange('modelo', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Qualquer modelo</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Tipo */}
          <div className="relative min-w-[160px]">
            <select
              value={filters.tipo}
              onChange={e => handleChange('tipo', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Qualquer tipo</option>
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
              <option value="estagio">Estágio</option>
              <option value="freelancer">Freelancer</option>
            </select>
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* PCD */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.pcd}
              onChange={e => handleChange('pcd', e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Vagas para PCD</span>
          </label>
        </div>
      </div>
    </div>
  );
}