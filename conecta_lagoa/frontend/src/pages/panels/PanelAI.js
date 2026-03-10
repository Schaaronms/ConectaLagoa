// src/pages/panels/PanelIA.jsx — Conecta Lagoa
// Painel completo de IA com 5 abas:
//   1. Ranking IA          — score real por vaga
//   2. Triagem Automática  — resumo + recomendação por candidatura
//   3. Gerar Vaga          — prompt livre → vaga estruturada
//   4. Perguntas           — gera e aprova perguntas de triagem
//   5. Relatório           — relatório HTML de contratação

import { useState, useEffect, useCallback } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
const getToken = () => localStorage.getItem('token') || localStorage.getItem('cl_token');
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

async function api(path, method = 'GET', body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: auth(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Erro na API');
  return data;
}

// ── Cores do design system ───────────────────────────────────────
const C = {
  navy: '#1a3a8f', blue: '#2d52c4', teal: '#0891b2',
  green: '#10b981', amber: '#f59e0b', red: '#ef4444',
  gray50: '#f8fafc', gray100: '#f1f5f9', gray200: '#e2e8f0',
  gray400: '#94a3b8', gray600: '#475569', gray900: '#0f172a',
};

// ── Componentes base ─────────────────────────────────────────────

function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${C.gray200}`,
      borderTopColor: C.blue, borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', display: 'inline-block',
    }}/>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', size = 'md', style: s }) {
  const base = {
    border: 'none', borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, transition: 'all .15s', display: 'inline-flex',
    alignItems: 'center', gap: 6, fontFamily: 'inherit',
    padding: size === 'sm' ? '6px 14px' : '10px 20px',
    fontSize: size === 'sm' ? 13 : 14,
  };
  const variants = {
    primary:  { background: C.blue,  color: '#fff' },
    secondary:{ background: C.gray100, color: C.gray900 },
    ghost:    { background: 'transparent', color: C.blue, border: `1px solid ${C.blue}` },
    danger:   { background: C.red,   color: '#fff' },
    green:    { background: C.green, color: '#fff' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...s }}>
      {children}
    </button>
  );
}

function Card({ children, style: s }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: `1px solid ${C.gray200}`,
      padding: 24, ...s,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, color }) {
  const colors = {
    green:  { bg: '#d1fae5', text: '#065f46' },
    amber:  { bg: '#fef3c7', text: '#92400e' },
    red:    { bg: '#fee2e2', text: '#991b1b' },
    blue:   { bg: '#dbeafe', text: '#1e40af' },
    gray:   { bg: C.gray100, text: C.gray600 },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      background: c.bg, color: c.text, borderRadius: 20,
      padding: '3px 10px', fontSize: 12, fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

function ScoreBar({ value, max = 100, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: C.gray100, borderRadius: 99 }}>
        <div style={{
          width: `${(value / max) * 100}%`, height: '100%',
          background: color || C.blue, borderRadius: 99,
          transition: 'width .6s ease',
        }}/>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || C.blue, minWidth: 36 }}>
        {value}
      </span>
    </div>
  );
}

function Alert({ type, children }) {
  const t = {
    error: { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '⚠️' },
    info:  { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af', icon: 'ℹ️' },
    success:{ bg: '#d1fae5', border: '#6ee7b7', color: '#065f46', icon: '✓' },
  }[type] || { bg: C.gray100, border: C.gray200, color: C.gray900, icon: '' };
  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      borderRadius: 8, padding: '12px 16px', fontSize: 14, display: 'flex', gap: 8,
    }}>
      <span>{t.icon}</span><span>{children}</span>
    </div>
  );
}

// ── ABA 1: RANKING IA ────────────────────────────────────────────
function TabRanking({ vagas }) {
  const [vagaId, setVagaId] = useState('');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const gerar = async () => {
    if (!vagaId) return;
    setLoading(true); setError(''); setRanking([]);
    try {
      const data = await api('/ranking-ia/por-vaga', 'POST', { vagaId });
      setRanking(data.ranking || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const scoreColor = s => s >= 85 ? C.green : s >= 70 ? C.amber : s >= 50 ? C.blue : C.gray400;
  const recBadge   = { avançar: 'green', aguardar: 'amber', descartar: 'red' };
  const medals     = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <p style={{ color: C.gray600, marginBottom: 20, fontSize: 14 }}>
        Score calculado por matching real: skills × requisitos, experiência, senioridade e localização.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select
          value={vagaId}
          onChange={e => setVagaId(e.target.value)}
          style={{
            flex: 1, minWidth: 260, padding: '10px 14px', borderRadius: 8,
            border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit',
            background: '#fff', color: C.gray900,
          }}
        >
          <option value="">Selecione uma vaga...</option>
          {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
        </select>
        <Btn onClick={gerar} disabled={loading || !vagaId}>
          {loading ? <><Spinner size={14}/> Analisando...</> : '✦ Gerar Ranking'}
        </Btn>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && ranking.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.gray400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Selecione uma vaga para gerar o ranking</div>
          <div style={{ fontSize: 13 }}>A IA analisa todos os candidatos e ordena por compatibilidade real</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.gray400 }}>
          <Spinner size={36}/>
          <p style={{ marginTop: 16 }}>Calculando scores de compatibilidade...</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {ranking.map((item, idx) => (
          <Card key={idx} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, lineHeight: 1, minWidth: 40, textAlign: 'center' }}>
              {medals[idx] || `#${idx + 1}`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{item.nome}</div>
                  <div style={{ fontSize: 13, color: C.gray600 }}>{item.cargo || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(item.score) }}>
                    {item.score}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray400 }}>/ 100</div>
                </div>
              </div>

              <ScoreBar value={item.score} color={scoreColor(item.score)}/>

              {item.breakdown && (
                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  {Object.entries(item.breakdown).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, color: C.gray600 }}>
                      <span style={{ color: C.gray400 }}>{k}: </span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              )}

              {item.traits && item.traits.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {item.traits.map(t => (
                    <span key={t} style={{
                      background: C.gray100, color: C.gray600, borderRadius: 20,
                      padding: '2px 10px', fontSize: 12,
                    }}>{t}</span>
                  ))}
                </div>
              )}

              {item.recomendacao && (
                <div style={{ marginTop: 10, fontSize: 13, color: C.gray600 }}>
                  💡 {item.recomendacao}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ABA 2: TRIAGEM AUTOMÁTICA ────────────────────────────────────
function TabTriagem({ vagas }) {
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [triagemData, setTriagemData]   = useState({});
  const [analisando, setAnalisando]     = useState({});
  const [filtroVaga, setFiltroVaga]     = useState('');

  useEffect(() => {
    api('/vagas/empresa/candidaturas')
      .then(rows => setCandidaturas(rows))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const analisar = async (candidaturaId) => {
    setAnalisando(p => ({ ...p, [candidaturaId]: true }));
    try {
      const data = await api('/ia/triagem', 'POST', { candidatura_id: candidaturaId });
      setTriagemData(p => ({ ...p, [candidaturaId]: data.triagem }));
    } catch (e) {
      alert('Erro: ' + e.message);
    }
    setAnalisando(p => ({ ...p, [candidaturaId]: false }));
  };

  const recColors = { avançar: 'green', aguardar: 'amber', descartar: 'red' };
  const recIcons  = { avançar: '✅', aguardar: '⏳', descartar: '❌' };

  const lista = filtroVaga
    ? candidaturas.filter(c => String(c.vaga_id) === filtroVaga)
    : candidaturas;

  return (
    <div>
      <p style={{ color: C.gray600, marginBottom: 20, fontSize: 14 }}>
        A IA lê o perfil do candidato versus os requisitos da vaga e recomenda: avançar, aguardar ou descartar.
      </p>

      <div style={{ marginBottom: 20 }}>
        <select
          value={filtroVaga}
          onChange={e => setFiltroVaga(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.gray200}`,
            fontSize: 14, fontFamily: 'inherit', background: '#fff',
          }}
        >
          <option value="">Todas as vagas</option>
          {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={32}/></div>}

      <div style={{ display: 'grid', gap: 12 }}>
        {lista.map(c => {
          const t = triagemData[c.id];
          const rec = t?.recomendacao || c.triagem_recomendacao;
          const isLoading = analisando[c.id];
          return (
            <Card key={c.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{c.candidato_nome}</div>
                  <div style={{ fontSize: 13, color: C.gray600 }}>{c.vaga_titulo}</div>
                  <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>
                    {c.candidato_cargo || ''} · Stage {c.stage ?? 0}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {rec && <Badge label={`${recIcons[rec] || ''} ${rec}`} color={recColors[rec] || 'gray'}/>}
                  <Btn size="sm" onClick={() => analisar(c.id)} disabled={isLoading}>
                    {isLoading ? <><Spinner size={12}/> Analisando</> : '✦ Triar com IA'}
                  </Btn>
                </div>
              </div>

              {(t || c.triagem_resumo) && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.gray100}` }}>
                  {(t?.resumo || c.triagem_resumo) && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.gray400, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resumo do perfil</div>
                      <div style={{ fontSize: 14, color: C.gray900, lineHeight: 1.6 }}>{t?.resumo || c.triagem_resumo}</div>
                    </div>
                  )}
                  {(t?.pontos_fortes || c.triagem_pontos_fortes) && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.gray400, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pontos fortes vs. vaga</div>
                      <div style={{ fontSize: 14, color: C.gray900, lineHeight: 1.6 }}>{t?.pontos_fortes || c.triagem_pontos_fortes}</div>
                    </div>
                  )}
                  {t?.justificativa && (
                    <div style={{ marginTop: 8, fontSize: 13, color: C.gray600, fontStyle: 'italic' }}>
                      💡 {t.justificativa}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {!loading && lista.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.gray400 }}>
            Nenhuma candidatura encontrada.
          </div>
        )}
      </div>
    </div>
  );
}

// ── ABA 3: GERADOR DE VAGA ────────────────────────────────────────
function TabGerarVaga() {
  const [prompt, setPrompt]   = useState('');
  const [vaga, setVaga]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copiado, setCopiado] = useState(false);

  const gerar = async () => {
    if (prompt.trim().length < 10) return;
    setLoading(true); setError(''); setVaga(null);
    try {
      const data = await api('/ia/gerar-vaga', 'POST', { prompt });
      setVaga(data.vaga);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copiar = () => {
    if (!vaga) return;
    const texto = `${vaga.titulo}\n\n${vaga.descricao}\n\nRequisitos:\n${vaga.requisitos}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const exemplos = [
    'Dev backend Node.js pleno, remoto, startup fintech',
    'Designer UI/UX sênior para e-commerce, híbrido SP',
    'Analista de dados júnior, CLT, empresa de logística',
  ];

  return (
    <div>
      <p style={{ color: C.gray600, marginBottom: 20, fontSize: 14 }}>
        Descreva a vaga com suas palavras. A IA gera o texto completo, profissional e atrativo.
      </p>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.gray400, marginBottom: 8 }}>Exemplos rápidos:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {exemplos.map(ex => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              style={{
                background: C.gray100, border: 'none', borderRadius: 20, padding: '4px 12px',
                fontSize: 12, cursor: 'pointer', color: C.gray600, fontFamily: 'inherit',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Descreva a vaga como se estivesse falando com alguém: cargo, nível, área, modalidade, salário..."
        rows={4}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 8, resize: 'vertical',
          border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit',
          lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 12,
        }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Btn onClick={gerar} disabled={loading || prompt.trim().length < 10}>
          {loading ? <><Spinner size={14}/> Gerando...</> : '✦ Gerar Vaga com IA'}
        </Btn>
        {vaga && (
          <Btn variant="ghost" onClick={copiar}>
            {copiado ? '✓ Copiado!' : '📋 Copiar texto'}
          </Btn>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {vaga && (
        <Card style={{ borderLeft: `4px solid ${C.blue}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, color: C.navy }}>{vaga.titulo}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {[vaga.area, vaga.tipo_contrato, vaga.modalidade, vaga.nivel_senioridade].filter(Boolean).map(tag => (
                  <Badge key={tag} label={tag} color="blue"/>
                ))}
              </div>
            </div>
            {vaga.salario_sugerido && (
              <div style={{ fontWeight: 700, color: C.green, fontSize: 16 }}>
                💰 {vaga.salario_sugerido}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray400, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line', color: C.gray900 }}>
              {vaga.descricao}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray400, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requisitos</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line', color: C.gray900 }}>
              {vaga.requisitos}
            </div>
          </div>

          {vaga.beneficios_sugeridos?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray400, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Benefícios sugeridos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {vaga.beneficios_sugeridos.map(b => (
                  <span key={b} style={{ background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '3px 12px', fontSize: 13 }}>
                    ✓ {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.gray100}` }}>
            <Alert type="info">
              Vaga gerada pela IA. Revise o conteúdo antes de publicar e ajuste conforme necessário.
            </Alert>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── ABA 4: PERGUNTAS DE TRIAGEM ──────────────────────────────────
function TabPerguntas({ vagas }) {
  const [vagaId, setVagaId]     = useState('');
  const [perguntas, setPerguntas] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError]       = useState('');
  const [salvo, setSalvo]       = useState(false);

  const gerar = async () => {
    if (!vagaId) return;
    setLoading(true); setError(''); setPerguntas([]); setSalvo(false);
    try {
      const data = await api('/ia/perguntas-triagem', 'POST', { vaga_id: vagaId });
      setPerguntas(data.perguntas || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const editarPergunta = (idx, novoTexto) => {
    setPerguntas(p => p.map((q, i) => i === idx ? { ...q, pergunta: novoTexto } : q));
  };

  const remover = (idx) => {
    setPerguntas(p => p.filter((_, i) => i !== idx));
  };

  const aprovar = async () => {
    setSalvando(true);
    try {
      await api('/ia/perguntas-triagem/aprovar', 'POST', { vaga_id: vagaId, perguntas });
      setSalvo(true);
    } catch (e) { setError(e.message); }
    finally { setSalvando(false); }
  };

  const tipoIcon = { aberta: '💬', escolha_multipla: '☑️', escala: '📊' };

  return (
    <div>
      <p style={{ color: C.gray600, marginBottom: 20, fontSize: 14 }}>
        A IA sugere 5 perguntas específicas para cada vaga. Você edita, remove ou adiciona antes de aprovar.
        Candidatos respondem ao se candidatar.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select
          value={vagaId}
          onChange={e => { setVagaId(e.target.value); setPerguntas([]); setSalvo(false); }}
          style={{
            flex: 1, minWidth: 260, padding: '10px 14px', borderRadius: 8,
            border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit',
          }}
        >
          <option value="">Selecione uma vaga...</option>
          {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
        </select>
        <Btn onClick={gerar} disabled={loading || !vagaId}>
          {loading ? <><Spinner size={14}/> Gerando...</> : '✦ Gerar Perguntas'}
        </Btn>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {salvo && <Alert type="success">Perguntas aprovadas! Candidatos as verão ao se candidatar.</Alert>}

      {perguntas.length > 0 && (
        <>
          <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            {perguntas.map((q, idx) => (
              <Card key={idx} style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    minWidth: 28, height: 28, borderRadius: '50%', background: C.blue,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.gray400, marginBottom: 6 }}>
                      {tipoIcon[q.tipo] || '💬'} {q.tipo?.replace('_', ' ')}
                    </div>
                    <textarea
                      value={q.pergunta}
                      onChange={e => editarPergunta(idx, e.target.value)}
                      rows={2}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6, resize: 'vertical',
                        border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit',
                        lineHeight: 1.5, boxSizing: 'border-box',
                      }}
                    />
                    {q.opcoes?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: C.gray400, marginBottom: 4 }}>Opções:</div>
                        {q.opcoes.map((op, i) => (
                          <div key={i} style={{ fontSize: 13, color: C.gray600, padding: '2px 0' }}>• {op}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remover(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray400, fontSize: 18, padding: 4 }}
                  >×</button>
                </div>
              </Card>
            ))}
          </div>

          <Btn onClick={aprovar} disabled={salvando} variant="green">
            {salvando ? <><Spinner size={14}/> Salvando...</> : '✓ Aprovar e Publicar Perguntas'}
          </Btn>
        </>
      )}
    </div>
  );
}

// ── ABA 5: RELATÓRIO DE CONTRATAÇÃO ─────────────────────────────
function TabRelatorio({ vagas }) {
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [gerando, setGerando]           = useState({});
  const [htmlMap, setHtmlMap]           = useState({});
  const [preview, setPreview]           = useState(null); // candidatura_id em preview

  useEffect(() => {
    api('/vagas/empresa/candidaturas')
      .then(rows => {
        // Só aprovados (stage 5)
        setCandidaturas(rows.filter(c => c.stage === 5 || c.status === 'Aprovado'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const gerar = async (candidaturaId) => {
    setGerando(p => ({ ...p, [candidaturaId]: true }));
    try {
      const data = await api('/ia/relatorio-contratacao', 'POST', { candidatura_id: candidaturaId });
      setHtmlMap(p => ({ ...p, [candidaturaId]: data.html }));
      setPreview(candidaturaId);
    } catch (e) { alert('Erro: ' + e.message); }
    setGerando(p => ({ ...p, [candidaturaId]: false }));
  };

  const imprimir = (candidaturaId) => {
    const html = htmlMap[candidaturaId];
    if (!html) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Relatório</title>
      <style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:auto}
      @media print{body{padding:0}}</style></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <p style={{ color: C.gray600, marginBottom: 20, fontSize: 14 }}>
        Gera relatório completo com timeline, scores, triagem IA e entrevistas para candidatos aprovados.
      </p>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spinner size={32}/></div>}

      {!loading && candidaturas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.gray400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600 }}>Nenhum candidato aprovado ainda</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Relatórios são gerados para candidaturas no stage "Aprovado"
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {candidaturas.map(c => (
          <Card key={c.id} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.candidato_nome}</div>
                    <div style={{ fontSize: 13, color: C.gray600 }}>{c.vaga_titulo}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {htmlMap[c.id] && (
                  <Btn size="sm" variant="ghost" onClick={() => setPreview(preview === c.id ? null : c.id)}>
                    {preview === c.id ? '▲ Fechar' : '👁 Ver relatório'}
                  </Btn>
                )}
                {htmlMap[c.id] && (
                  <Btn size="sm" variant="secondary" onClick={() => imprimir(c.id)}>
                    🖨 Imprimir
                  </Btn>
                )}
                <Btn size="sm" onClick={() => gerar(c.id)} disabled={gerando[c.id]}>
                  {gerando[c.id] ? <><Spinner size={12}/> Gerando</> : htmlMap[c.id] ? '↺ Regerar' : '✦ Gerar Relatório'}
                </Btn>
              </div>
            </div>

            {preview === c.id && htmlMap[c.id] && (
              <div style={{
                marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.gray100}`,
                border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: 'hidden',
              }}>
                <div
                  style={{ padding: 24, background: '#fff' }}
                  dangerouslySetInnerHTML={{ __html: htmlMap[c.id] }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────
const TABS = [
  { id: 'ranking',   label: '🎯 Ranking IA',        desc: 'Score por candidato × vaga' },
  { id: 'triagem',   label: '🔍 Triagem Auto',       desc: 'Análise automática de candidatos' },
  { id: 'gerar',     label: '✍️ Gerar Vaga',         desc: 'Prompt → vaga completa' },
  { id: 'perguntas', label: '❓ Perguntas',           desc: 'Triagem personalizada' },
  { id: 'relatorio', label: '📋 Relatório',           desc: 'Relatório de contratação' },
];

export default function PanelIA() {
  const [tab, setTab]       = useState('ranking');
  const [vagas, setVagas]   = useState([]);
  const [loadVagas, setLoadVagas] = useState(true);

  useEffect(() => {
    api('/vagas/empresa/minhas')
      .then(data => setVagas(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadVagas(false));
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", color: C.gray900 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.navy }}>
          IA & Automação
        </h1>
        <p style={{ margin: '6px 0 0', color: C.gray400, fontSize: 14 }}>
          Ferramentas de inteligência artificial para otimizar seu processo seletivo
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, background: C.gray100, borderRadius: 12,
        padding: 4, marginBottom: 28, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 10, border: 'none',
              fontFamily: 'inherit', fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? C.navy : C.gray400,
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              transition: 'all .15s', fontSize: 13, whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loadVagas ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={36}/></div>
      ) : (
        <>
          {tab === 'ranking'   && <TabRanking   vagas={vagas}/>}
          {tab === 'triagem'   && <TabTriagem   vagas={vagas}/>}
          {tab === 'gerar'     && <TabGerarVaga/>}
          {tab === 'perguntas' && <TabPerguntas vagas={vagas}/>}
          {tab === 'relatorio' && <TabRelatorio vagas={vagas}/>}
        </>
      )}
    </div>
  );
}
