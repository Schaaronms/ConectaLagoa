// VagasGrid.jsx — VERSÃO CORRIGIDA
// Fix: vaga.tipo → vaga.tipo_contrato (alinhado com o banco)
// Fix: botão "Candidatar-se" conectado à API real
import { useState } from 'react';
import { MapPin, Clock, DollarSign, Briefcase } from 'lucide-react';

// Aceita tipo_contrato (banco) ou tipo (legado)
function getTipo(vaga) {
  return vaga.tipo_contrato || vaga.tipo || 'CLT';
}

function getTipoBadgeClass(tipo) {
  if (!tipo) return 'vaga-tipo-badge clt';
  const t = tipo.toLowerCase();
  if (t === 'clt')                         return 'vaga-tipo-badge clt';
  if (t === 'pj')                          return 'vaga-tipo-badge pj';
  if (t === 'estagio' || t === 'estágio')  return 'vaga-tipo-badge estagio';
  return 'vaga-tipo-badge outros';
}

function VagaCard({ vaga, onClick }) {
  const inicial = (vaga.empresa_nome || vaga.titulo || '?')[0].toUpperCase();
  const tipo    = getTipo(vaga);

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
        {(vaga.local || vaga.cidade) && (
          <div className="vaga-card-meta-item">
            <MapPin size={14} />
            <span>{vaga.local || vaga.cidade}</span>
          </div>
        )}
        {vaga.modelo && (
          <div className="vaga-card-meta-item">
            <Clock size={14} />
            <span>{vaga.modelo}</span>
          </div>
        )}
        {vaga.salario && (
          <div className="vaga-card-meta-item salario">
            <DollarSign size={14} />
            <span>{vaga.salario}</span>
          </div>
        )}
      </div>

      {vaga.descricao && (
        <p className="vaga-card-desc">
          {vaga.descricao.length > 120 ? vaga.descricao.slice(0, 120) + '...' : vaga.descricao}
        </p>
      )}

      <div className="vaga-card-footer">
        <span className={getTipoBadgeClass(tipo)}>{tipo}</span>
        {vaga.pcd && (
          <span className="vaga-tipo-badge outros">♿ PCD</span>
        )}
        <button className="vaga-card-btn" onClick={e => { e.stopPropagation(); onClick(); }}>
          Ver detalhes →
        </button>
      </div>
    </div>
  );
}

// ─── Modal de detalhe + candidatura ──────────────────────────────
function ModalVaga({ vaga, onClose }) {
  const vagaId = vaga.id || vaga._id;
  const tipo   = getTipo(vaga);

  // Cache local para não re-candidatar após sucesso
  const cacheKey     = `candidatou_${vagaId}`;
  const jaFezAntes   = localStorage.getItem(cacheKey) === 'true';

  const [btnStatus, setBtnStatus] = useState(jaFezAntes ? 'already' : 'idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleCandidatar = async () => {
    const token = localStorage.getItem('token');

    // Sem token → vai para login
    if (!token) {
      window.location.href = '/login?redirect=/vagas';
      return;
    }

    if (btnStatus === 'already' || btnStatus === 'success') return;

    setBtnStatus('loading');
    try {
      const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const res  = await fetch(`${BASE}/vagas/${vagaId}/candidatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mensagem_candidato: '' }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        localStorage.setItem(cacheKey, 'true');
        setBtnStatus('success');
        setFeedbackMsg('Candidatura enviada! Acompanhe no seu Dashboard. 🎉');
      } else if (res.status === 409 || res.status === 400) {
        // Já candidatou (unique constraint retorna 409 na versão corrigida do backend)
        localStorage.setItem(cacheKey, 'true');
        setBtnStatus('already');
        setFeedbackMsg('Você já se candidatou a esta vaga.');
      } else if (res.status === 403) {
        setBtnStatus('idle');
        setFeedbackMsg('Apenas candidatos podem se candidatar. Faça login com uma conta candidato.');
      } else {
        setBtnStatus('idle');
        setFeedbackMsg(data?.error || 'Erro ao enviar. Tente novamente.');
      }
    } catch {
      setBtnStatus('idle');
      setFeedbackMsg('Erro de conexão. Verifique sua internet.');
    }
  };

  const btnConfig = {
    idle:    { label: '🚀 Candidatar-se a esta vaga', disabled: false, style: 'primary' },
    loading: { label: 'Enviando...',                  disabled: true,  style: 'loading' },
    success: { label: '✅ Candidatura enviada!',       disabled: true,  style: 'success' },
    already: { label: '✅ Já me candidatei',           disabled: true,  style: 'success' },
  }[btnStatus];

  const btnStyle = {
    primary: { background: 'linear-gradient(135deg, #1a3a8f, #2d52c4)', color: 'white', cursor: 'pointer' },
    loading: { background: '#94a3b8', color: 'white', cursor: 'default' },
    success: { background: '#dcfce7', color: '#16a34a', cursor: 'default', border: '1px solid #86efac' },
  }[btnConfig.style];

  const token = localStorage.getItem('token');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h2>{vaga.titulo}</h2>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
              {vaga.empresa_nome || 'Empresa confidencial'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            {(vaga.local || vaga.cidade) && (
              <div className="modal-meta-item"><MapPin size={14} />{vaga.local || vaga.cidade}</div>
            )}
            {vaga.modelo && (
              <div className="modal-meta-item"><Clock size={14} />{vaga.modelo}</div>
            )}
            {vaga.salario && (
              <div className="modal-meta-item"><DollarSign size={14} />{vaga.salario}</div>
            )}
            {vaga.area && (
              <div className="modal-meta-item"><Briefcase size={14} />{vaga.area}</div>
            )}
            <span className={getTipoBadgeClass(tipo)}>{tipo}</span>
            {vaga.pcd && <span className="vaga-tipo-badge outros">♿ PCD</span>}
          </div>

          <p className="modal-desc">
            {vaga.descricaoCompleta || vaga.descricao || 'Sem descrição disponível.'}
          </p>

          {vaga.requisitos && (
            <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', marginBottom: 6, color: '#1e293b' }}>Requisitos</strong>
              {vaga.requisitos}
            </div>
          )}

          {/* Feedback de candidatura */}
          {feedbackMsg && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: btnStatus === 'success' || btnStatus === 'already' ? '#dcfce7' : '#fee2e2',
              color:      btnStatus === 'success' || btnStatus === 'already' ? '#16a34a' : '#dc2626',
              border:     `1px solid ${btnStatus === 'success' || btnStatus === 'already' ? '#86efac' : '#fca5a5'}`,
            }}>
              {feedbackMsg}
            </div>
          )}

          {/* Botão principal */}
          {!token ? (
            <a href="/login?redirect=/vagas" className="modal-candidatar-btn"
              style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #1a3a8f, #2d52c4)', color: 'white', padding: '14px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, marginTop: 20 }}>
              🔐 Entrar para se candidatar
            </a>
          ) : (
            <button className="modal-candidatar-btn"
              onClick={handleCandidatar}
              disabled={btnConfig.disabled}
              style={{ ...btnStyle, width: '100%', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600, marginTop: 20, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {btnConfig.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grid principal ────────────────────────────────────────────────
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

      {selectedVaga && (
        <ModalVaga
          vaga={selectedVaga}
          onClose={() => setSelectedVaga(null)}
        />
      )}
    </>
  );
}
