import { Briefcase, MapPin, Home } from 'lucide-react';
import { useState, useEffect } from 'react';

const ESTADOS = [
  { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' }, { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' }, { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' }, { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' }, { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

export default function Filters({ filters, setFilters, totalVagas }) {
  const [municipios, setMunicipios]       = useState([]);
  const [loadingMun, setLoadingMun]       = useState(false);
  const [uf, setUf]                       = useState('RS');

  // Busca municípios toda vez que o estado muda
  useEffect(() => {
    if (!uf) { setMunicipios([]); return; }
    setLoadingMun(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then(data => setMunicipios(data.map(m => m.nome)))
      .catch(() => setMunicipios([]))
      .finally(() => setLoadingMun(false));
  }, [uf]);

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="filters-bar">
      <div className="filters-inner">

        <span className="filters-total">
          {totalVagas} {totalVagas === 1 ? 'vaga encontrada' : 'vagas encontradas'}
        </span>

        {/* Local — UF + Município */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

          {/* Select de estado */}
          <div className="filters-select-wrapper" style={{ minWidth: 72 }}>
            <select
              value={uf}
              onChange={e => {
                setUf(e.target.value);
                handleChange('local', ''); // limpa cidade ao trocar estado
              }}
              className="filters-select"
              style={{ paddingLeft: 10 }}
            >
              <option value="">UF</option>
              {ESTADOS.map(e => (
                <option key={e.uf} value={e.uf}>{e.uf}</option>
              ))}
            </select>
          </div>

          {/* Select de município */}
          <div className="filters-select-wrapper">
            <MapPin className="filters-select-icon" />
            <select
              value={filters.local}
              onChange={e => handleChange('local', e.target.value)}
              className="filters-select"
              disabled={!uf || loadingMun}
            >
              <option value="">
                {loadingMun ? 'Carregando...' : 'Qualquer cidade'}
              </option>
              {municipios.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

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