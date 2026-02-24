import { Briefcase, MapPin, Home } from 'lucide-react';

export default function Filters({ filters, setFilters, totalVagas }) {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="filters-bar">
      <div className="filters-inner">

        <span className="filters-total">
          {totalVagas} {totalVagas === 1 ? 'vaga encontrada' : 'vagas encontradas'}
        </span>

        {/* Local */}
        <div className="filters-select-wrapper">
          <MapPin className="filters-select-icon" />
          <select
            value={filters.local}
            onChange={e => handleChange('local', e.target.value)}
            className="filters-select"
          >
            <option value="">Qualquer local</option>
            <option value="Lagoa da Prata">Lagoa da Prata</option>
            <option value="Passo Fundo">Passo Fundo</option>
            <option value="Erechim">Erechim</option>
            <option value="remoto">Remoto</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {/* Modelo */}
        <div className="filters-select-wrapper">
          <Home className="filters-select-icon" />
          <select
            value={filters.modelo}
            onChange={e => handleChange('modelo', e.target.value)}
            className="filters-select"
          >
            <option value="">Qualquer modelo</option>
            <option value="presencial">Presencial</option>
            <option value="hibrido">Híbrido</option>
            <option value="remoto">Remoto</option>
          </select>
        </div>

        {/* Tipo */}
        <div className="filters-select-wrapper">
          <Briefcase className="filters-select-icon" />
          <select
            value={filters.tipo}
            onChange={e => handleChange('tipo', e.target.value)}
            className="filters-select"
          >
            <option value="">Qualquer tipo</option>
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
            <option value="estagio">Estágio</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>

        {/* PCD */}
        <label className="filters-pcd">
          <input
            type="checkbox"
            checked={filters.pcd}
            onChange={e => handleChange('pcd', e.target.checked)}
          />
          <span>Vagas para PCD</span>
        </label>

      </div>
    </div>
  );
}
