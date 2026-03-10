// ── PanelRankingIA.js — Conecta Lagoa ────────────────────────
// Painel "Ranking IA" separado do EmpresaDashboard.
// Duas seções:
//   1. Ranking por vaga selecionada (ordenado por score)
//   2. Candidatos × todas as vagas abertas (barras de compatibilidade)
// A chamada à Claude API é feita pelo BACKEND (/api/ranking-ia)
// para manter a chave segura no servidor.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import './RankingIA.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
const getToken = () => localStorage.getItem('token') || localStorage.getItem('cl_token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const AVATAR_COLORS = [
  '#1a3a8f','#2d52c4','#10b981','#f59e0b','#e07b00','#6366f1','#0891b2',
];

// ── Score ring SVG ──────────────────────────────────────────
function ScoreRing({ score, color }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ - (circ * score / 100);
  return (
    <div className="ria-ring">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#e4e8f0" strokeWidth="3.5"/>
        <circle cx="26" cy="26" r={r} fill="none" stroke={color}
          strokeWidth="3.5" strokeDasharray={`${circ - dash} ${dash}`}
          strokeLinecap="round"/>
      </svg>
      <div className="ria-ring-num" style={{ color }}>{score}%</div>
    </div>
  );
}

// ── Cor pelo score ──────────────────────────────────────────
function scoreColor(s) {
  return s >= 85 ? '#10b981' : s >= 70 ? '#f59e0b' : s >= 50 ? '#1a3a8f' : '#94a3b8';
}

// ────────────────────────────────────────────────────────────
// SEÇÃO 1 — Ranking por vaga
// ────────────────────────────────────────────────────────────
function SecaoRankingPorVaga({ vagas, candidatos }) {
  const [vagaId, setVagaId] = useState('');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function gerarRanking() {
    if (!vagaId) return;
    setLoading(true);
    setError('');
    setRanking([]);

    try {
      const res = await fetch(`${BASE_URL}/ranking-ia/por-vaga`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ vagaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar ranking');
      setRanking(data.ranking || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const badges = ['gold', 'silver', 'bronze'];

  return (
    <div>
      <div className="ria-section-header">
        <div className="ria-section-title">Ranking Inteligente com IA</div>
        <div className="ria-section-sub">
          Score automático de aderência · Matching comportamental · Sugestões baseadas em histórico
        </div>
      </div>

      <div className="ria-controls">
        <select
          className="ria-select"
          value={vagaId}
          onChange={e => setVagaId(e.target.value)}
        >
          <option value="">Selecione uma vaga para ranquear...</option>
          {vagas.map(v => (
            <option key={v.id} value={v.id}>{v.titulo}</option>
          ))}
        </select>
        <button
          className="ria-btn ria-btn-primary"
          onClick={gerarRanking}
          disabled={loading || !vagaId}
        >
          {loading ? '⟳ Analisando...' : '✦ Gerar Ranking com IA'}
        </button>
      </div>

      <div className="ria-grid">
        {loading && (
          <div className="ria-loading">
            <div className="ria-spinner"/>
            <p>IA analisando compatibilidade dos candidatos...</p>
          </div>
        )}
        {error && <div className="ria-error">❌ {error}</div>}
        {!loading && !error && ranking.length === 0 && (
          <div className="ria-empty">
            <strong>Selecione uma vaga acima</strong>
            A IA vai analisar os candidatos e gerar um ranking automaticamente.
          </div>
        )}
        {ranking.map((item, idx) => {
          const cand = candidatos.find(c =>
            c.nome?.toLowerCase() === item.nome?.toLowerCase() ||
            c.name?.toLowerCase() === item.nome?.toLowerCase()
          ) || {};
          const color = scoreColor(item.score);
          const skills = (cand.habilidades || cand.tags || []).slice(0, 3);
          const traits = item.traits || [];

          return (
            <div key={idx} className="ria-card">
              <div className={`ria-rank-badge${idx < 3 ? ' ' + badges[idx] : ''}`}>
                {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
              </div>

              <div className="ria-card-header">
                <ScoreRing score={item.score} color={color}/>
                <div className="ria-card-info">
                  <div className="ria-card-name">{item.nome}</div>
                  <div className="ria-card-role">{cand.cargo || cand.role || item.cargo || '—'}</div>
                </div>
                <button className="ria-invite-btn">Convidar</button>
              </div>

              {traits.length > 0 && (
                <div className="ria-tags">
                  {traits.map(t => <span key={t} className="ria-tag">{t}</span>)}
                </div>
              )}

              <div className="ria-tip">
                <div className="ria-tip-dot"/>
                <div><strong>IA recomenda:</strong> {item.recomendacao}</div>
              </div>

              {skills.length > 0 && (
                <div className="ria-skills">
                  {skills.map(s => <span key={s} className="ria-skill-chip">{s}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SEÇÃO 2 — Candidatos × Vagas Abertas
// ────────────────────────────────────────────────────────────
function SecaoCandidatosVagas({ vagas, candidatos }) {
  const [resultado, setResultado] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function analisarTodos() {
    setLoading(true);
    setError('');
    setResultado([]);

    try {
      const res = await fetch(`${BASE_URL}/ranking-ia/candidatos-vagas`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ vagaIds: vagas.map(v => v.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar');
      setResultado(data.resultado || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Divider */}
      <div className="ria-divider">
        <div className="ria-divider-line"/>
        <h2>Candidatos × Vagas Abertas</h2>
        <span className="ria-ai-pill">IA</span>
        <div className="ria-divider-line"/>
      </div>
      <p style={{ fontSize:12, color:'#7b82a0', marginBottom:20, marginTop:-12 }}>
        Compatibilidade de cada candidato com todas as vagas publicadas pela empresa.
      </p>

      <div className="ria-controls" style={{ marginBottom:20 }}>
        <button
          className="ria-btn ria-btn-outline"
          onClick={analisarTodos}
          disabled={loading || vagas.length === 0}
        >
          {loading ? '⟳ Analisando...' : '✦ Analisar Compatibilidade com Todas as Vagas'}
        </button>
      </div>

      <div className="ria-cand-grid">
        {loading && (
          <div className="ria-loading">
            <div className="ria-spinner"/>
            <p>IA calculando scores de todos os candidatos × vagas...</p>
            <p style={{ fontSize:11 }}>Isso pode levar alguns segundos</p>
          </div>
        )}
        {error && <div className="ria-error">❌ {error}</div>}
        {!loading && !error && resultado.length === 0 && (
          <div className="ria-empty">
            <strong>Clique em "Analisar" para gerar os scores</strong>
            A IA vai calcular a compatibilidade de cada candidato com todas as vagas abertas.
          </div>
        )}
        {resultado.map((item, idx) => {
          const cor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const initials = item.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const cand = candidatos.find(c =>
            c.nome?.toLowerCase() === item.nome?.toLowerCase() ||
            c.name?.toLowerCase() === item.nome?.toLowerCase()
          ) || {};
          const skills = (cand.habilidades || cand.tags || []).slice(0, 3);

          return (
            <div key={idx} className="ria-cand-card">
              <div className="ria-cand-header">
                <div className="ria-avatar" style={{ background: cor }}>{initials}</div>
                <div className="ria-cand-meta">
                  <div className="ria-cand-name">{item.nome}</div>
                  <div className="ria-cand-role">{cand.cargo || cand.role || item.cargo || '—'}</div>
                </div>
                <button className="ria-invite-btn" style={{ fontSize:11, padding:'5px 10px' }}>Ver Perfil</button>
              </div>

              {skills.length > 0 && (
                <div className="ria-cand-chips">
                  {skills.map(s => <span key={s} className="ria-skill-chip">{s}</span>)}
                </div>
              )}

              <div className="ria-vagas-list">
                {vagas.map(v => {
                  const sc = item.vagas?.[v.id] ?? 0;
                  const barColor = scoreColor(sc);
                  const isBest = v.id === item.melhorVaga;
                  return (
                    <div key={v.id} className="ria-vaga-row">
                      <div className="ria-vaga-label">
                        {v.titulo}
                        <small>{v.tipo_contrato || v.area || ''}</small>
                      </div>
                      <div className="ria-bar-wrap">
                        <div className="ria-bar-fill" style={{ width:`${sc}%`, background:barColor }}/>
                      </div>
                      <div className="ria-score-pct" style={{ color:barColor }}>{sc}%</div>
                      {isBest
                        ? <span className="ria-best-pill">✓ Melhor</span>
                        : <span style={{ width:46, flexShrink:0 }}/>
                      }
                    </div>
                  );
                })}
              </div>

              <div className="ria-cand-footer">
                <div className="ria-tip-dot" style={{ width:6, height:6, borderRadius:'50%', background:'#e07b00', flexShrink:0 }}/>
                {item.dica}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ────────────────────────────────────────────────────────────
export default function PanelRankingIA() {
  const [vagas, setVagas]         = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Carrega vagas da empresa + candidatos do banco em paralelo
    Promise.all([
      fetch(`${BASE_URL}/vagas/empresa/minhas`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${BASE_URL}/talentos`,             { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([vagasData, candidatosData]) => {
        setVagas(Array.isArray(vagasData) ? vagasData : []);
        setCandidatos(Array.isArray(candidatosData) ? candidatosData : []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  if (loadingData) {
    return (
      <div className="ria-loading" style={{ paddingTop:80 }}>
        <div className="ria-spinner"/>
        <p>Carregando vagas e candidatos...</p>
      </div>
    );
  }

  return (
    <div>
      <SecaoRankingPorVaga vagas={vagas} candidatos={candidatos}/>
      <SecaoCandidatosVagas vagas={vagas} candidatos={candidatos}/>
    </div>
  );
}