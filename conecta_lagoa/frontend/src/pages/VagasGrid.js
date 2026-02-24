import { useState } from 'react';
import { MapPin, Clock, DollarSign } from 'lucide-react';

const getTipoBadgeClass = (tipo) => {
  if (!tipo) return 'vaga-tipo-badge clt';
  const t = tipo.toLowerCase();
  if (t === 'clt') return 'vaga-tipo-badge clt';
  if (t === 'pj') return 'vaga-tipo-badge pj';
  if (t === 'estagio' || t === 'estágio') return 'vaga-tipo-badge estagio';
  return 'vaga-tipo-badge outros';
};

function VagaCard({ vaga, onClick }) {
  const inicial = vaga.empresa_nome
    ? vaga.empresa_nome[0].toUpperCase()
    : vaga.titulo[0].toUpperCase();

  return (
    <div className="vaga-card" onClick={onClick}>
      <div className="vaga-card-header">
        <div>
          <h3>{vaga.titulo}</h3>
          <div className="vaga-card-empresa">
            {vaga.empresa_nome || 'Empresa confidencial'}
          </div>
        </div>
        <div className="vaga-card-empresa-avatar">{inicial}</div>
      </div>

      <div className="vaga-card-meta">
        {vaga.local && (
          <div className="vaga-card-meta-item">
            <MapPin />
            <span>{vaga.local}</span>
          </div>
        )}
        {vaga.modelo && (
          <div className="vaga-card-meta-item">
            <Clock />
            <span>{vaga.modelo}</span>
          </div>
        )}
        {vaga.salario && (
          <div className="vaga-card-meta-item salario">
            <DollarSign />
            <span>{vaga.salario}</span>
          </div>
        )}
      </div>

      {vaga.descricao && (
        <p className="vaga-card-desc">{vaga.descricao}</p>
      )}

      <div className="vaga-card-footer">
        <span className={getTipoBadgeClass(vaga.tipo)}>
          {vaga.tipo || 'CLT'}
        </span>
        <button className="vaga-card-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Ver detalhes →
        </button>
      </div>
    </div>
  );
}

export default function VagasGrid({ vagas }) {
  const [selectedVaga, setSelectedVaga] = useState(null);

  return (
    <>
      <div className="vagas-grid">
        {vagas.map(vaga => (
          <VagaCard
            key={vaga.id || vaga._id}
            vaga={vaga}
            onClick={() => setSelectedVaga(vaga)}
          />
        ))}
      </div>

      {/* MODAL */}
      {selectedVaga && (
        <div className="modal-overlay" onClick={() => setSelectedVaga(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <div>
                <h2>{selectedVaga.titulo}</h2>
                <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
                  {selectedVaga.empresa_nome || 'Empresa confidencial'}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedVaga(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-meta">
                {selectedVaga.local && (
                  <div className="modal-meta-item">
                    <MapPin />
                    {selectedVaga.local}
                  </div>
                )}
                {selectedVaga.modelo && (
                  <div className="modal-meta-item">
                    <Clock />
                    {selectedVaga.modelo}
                  </div>
                )}
                {selectedVaga.salario && (
                  <div className="modal-meta-item">
                    <DollarSign />
                    {selectedVaga.salario}
                  </div>
                )}
                <span className={getTipoBadgeClass(selectedVaga.tipo)}>
                  {selectedVaga.tipo || 'CLT'}
                </span>
              </div>

              <p className="modal-desc">
                {selectedVaga.descricaoCompleta || selectedVaga.descricao}
              </p>

              <button className="modal-candidatar-btn">
                🚀 Candidatar-se a esta vaga
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
