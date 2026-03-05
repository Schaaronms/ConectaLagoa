// PanelFunil.jsx — Conecta Lagoa
// Recebe candidatos reais da API quando se inscrevem em vagas da empresa
// Endpoint: GET /api/vagas/empresa/candidaturas
// Endpoint: PUT /api/candidaturas/:id/stage
import { useState, useEffect, useCallback } from 'react';

const V = {
  bg:'#f4f6fb', surface:'#ffffff', surface2:'#f0f3fa', border:'#e2e8f4',
  accent:'#1a3a8f', accent2:'#2d52c4', accent3:'#e07b00',
  green:'#10b981', orange:'#e07b00', red:'#ef4444',
  text:'#1a1f36', muted:'#6b7280', muted2:'#9ca3af',
};

const STAGES = [
  { id:0, name:'Recebido',   color:'#1a3a8f' },
  { id:1, name:'Triagem',    color:'#2d52c4' },
  { id:2, name:'Entrevista', color:'#e07b00' },
  { id:3, name:'Técnico',    color:'#c96a00' },
  { id:4, name:'Proposta',   color:'#10b981' },
  { id:5, name:'Contratado', color:'#059669' },
  { id:6, name:'Rejeitado',  color:'#ef4444' },
];

// Status da API do candidato → stage do kanban
// Espelha os STATUS_CONFIG do CandidatoDashboard.js
const STATUS_TO_STAGE = {
  'Enviado':     0,
  'Visualizado': 0,
  'Em Análise':  1,
  'Entrevista':  2,
  'Aprovado':    5,
  'Reprovado':   6,
};

// Stage kanban → status que o backend entende
const STAGE_TO_STATUS = {
  0: 'Visualizado',
  1: 'Em Análise',
  2: 'Entrevista',
  3: 'Em Análise',
  4: 'Em Análise',
  5: 'Aprovado',
  6: 'Reprovado',
};

// Converte candidatura vinda da API → card do Kanban
function apiToCard(c) {
  const nome = c.candidato_nome || c.nome || '—';
  const parts = nome.trim().split(' ');
  const initials = ((parts[0]?.[0]||'') + (parts[1]?.[0]||'')).toUpperCase();
  const palette  = [V.accent, V.accent2, V.accent3, V.green, '#c96a00', '#7c3aed'];

  return {
    id:           c.id,
    name:         nome,
    role:         c.candidato_cargo || c.cargo || 'Candidato',
    initials,
    color:        palette[nome.charCodeAt(0) % palette.length],
    stage:        STATUS_TO_STAGE[c.status] ?? 0,
    score:        c.score_ia ?? c.score ?? 70,
    rating:       c.rating   ?? 0,
    notes:        Array.isArray(c.notes) ? c.notes : (c.observacao ? [c.observacao] : []),
    vaga_id:      c.vaga_id,
    vaga_titulo:  c.vaga_titulo || c.titulo || '—',
    status_api:   c.status,
    candidato_id: c.candidato_id,
    created_at:   c.created_at,
  };
}

function scoreColor(s) { return s>=85?V.green:s>=70?V.orange:V.red; }

// ─── Estrelas ─────────────────────────────────────────────────────
function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i}
          onClick={e=>{ e.stopPropagation(); onChange(i===value?0:i); }}
          onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}
          style={{ fontSize:14, cursor:'pointer', color:(hover||value)>=i?'#e07b00':'#e2e8f4', transition:'color 0.1s', userSelect:'none' }}>★</span>
      ))}
    </div>
  );
}

// ─── Painel lateral ───────────────────────────────────────────────
function CardDetail({ card, onClose, onUpdate }) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving]   = useState(false);
  const stageColor = STAGES[card.stage]?.color || V.accent;

  const addNote = () => {
    if (!newNote.trim()) return;
    onUpdate({ ...card, notes:[...card.notes, newNote.trim()] });
    setNewNote('');
  };

  const moveStage = async (stageId) => {
    setSaving(true);
    await onUpdate({ ...card, stage:stageId });
    setSaving(false);
  };

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget)onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.28)', backdropFilter:'blur(4px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
      <div style={{ width:420, height:'100%', background:V.surface, borderLeft:`1px solid ${V.border}`, display:'flex', flexDirection:'column', animation:'slideRight 0.22s ease' }}>

        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:`${card.color}22`, color:card.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700 }}>{card.initials}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:V.text }}>{card.name}</div>
              <div style={{ fontSize:12, color:V.muted }}>{card.role}</div>
              <div style={{ marginTop:4, display:'inline-flex', gap:4, fontSize:10, padding:'2px 8px', background:'rgba(26,58,143,0.08)', color:V.accent, borderRadius:4 }}>
                📋 {card.vaga_titulo}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted, width:28, height:28, borderRadius:7, cursor:'pointer', fontSize:14 }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 14px', background:V.surface2, borderRadius:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:stageColor }}/>
            <span style={{ fontSize:12, color:V.muted }}>Etapa:</span>
            <span style={{ fontSize:12, fontWeight:600, color:stageColor }}>{STAGES[card.stage].name}</span>
            {saving && <span style={{ fontSize:10, color:V.muted2, marginLeft:'auto' }}>Salvando...</span>}
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Score IA</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:8, background:V.surface2, borderRadius:4 }}>
                <div style={{ width:`${card.score}%`, height:'100%', background:scoreColor(card.score), borderRadius:4 }}/>
              </div>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:scoreColor(card.score) }}>{card.score}</span>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Avaliação</div>
            <Stars value={card.rating} onChange={r=>onUpdate({...card,rating:r})}/>
          </div>

          {card.created_at && (
            <div style={{ marginBottom:20, fontSize:12, color:V.muted }}>
              📅 Candidatura em {new Date(card.created_at).toLocaleDateString('pt-BR')}
            </div>
          )}

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Mover para etapa</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {STAGES.map(s=>(
                <button key={s.id} onClick={()=>moveStage(s.id)}
                  style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer',
                    border:`1px solid ${card.stage===s.id?s.color:V.border}`,
                    background:card.stage===s.id?`${s.color}18`:'none',
                    color:card.stage===s.id?s.color:V.muted2, transition:'all 0.15s' }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Notas</div>
            {card.notes.length===0 && <div style={{ fontSize:12, color:V.muted2, padding:'8px 0' }}>Nenhuma nota.</div>}
            {card.notes.map((n,i)=>(
              <div key={i} style={{ display:'flex', gap:8, padding:'10px 12px', background:V.surface2, borderRadius:8, marginBottom:8, fontSize:12 }}>
                <span style={{ flex:1, color:V.text, lineHeight:1.5 }}>{n}</span>
                <button onClick={()=>onUpdate({...card,notes:card.notes.filter((_,idx)=>idx!==i)})}
                  style={{ background:'none', border:'none', color:V.muted2, cursor:'pointer', fontSize:12 }}>✕</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <input value={newNote} onChange={e=>setNewNote(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') addNote(); }}
                placeholder="Adicionar nota... (Enter)"
                style={{ flex:1, background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:12, outline:'none' }}
                onFocus={e=>e.target.style.borderColor=V.accent}
                onBlur={e=>e.target.style.borderColor=V.border}/>
              <button onClick={addNote} style={{ background:V.accent, border:'none', color:'white', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────
function KanbanCard({ card, stageColor, onDragStart, onOpenDetail, onRating }) {
  const pill = card.score>=85?{bg:'rgba(16,185,129,0.12)',color:'#10b981'}:card.score>=70?{bg:'rgba(224,123,0,0.12)',color:'#e07b00'}:{bg:'rgba(239,68,68,0.12)',color:'#ef4444'};
  return (
    <div draggable
      onDragStart={e=>{ e.dataTransfer.effectAllowed='move'; onDragStart(card.id); }}
      onClick={()=>onOpenDetail(card)}
      style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:10, padding:12, marginBottom:8, cursor:'grab', transition:'all 0.18s', userSelect:'none' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=stageColor; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(26,58,143,0.1)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=V.border; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${card.color}22`, color:card.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{card.initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:V.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
          <div style={{ fontSize:10, color:V.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.role}</div>
        </div>
      </div>

      {/* Nome da vaga — destaque */}
      <div style={{ fontSize:9, padding:'2px 7px', background:'rgba(26,58,143,0.07)', color:V.accent, borderRadius:4, marginBottom:8, display:'inline-block', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        📋 {card.vaga_titulo}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:3, background:V.surface2, borderRadius:2 }}>
          <div style={{ width:`${card.score}%`, height:'100%', background:scoreColor(card.score), borderRadius:2 }}/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:scoreColor(card.score), minWidth:22 }}>{card.score}</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div onClick={e=>e.stopPropagation()} style={{ display:'flex', gap:1 }}>
          {[1,2,3,4,5].map(i=>(
            <span key={i} onClick={e=>{ e.stopPropagation(); onRating(card.id,i===card.rating?0:i); }}
              style={{ fontSize:11, cursor:'pointer', color:card.rating>=i?'#e07b00':'#e2e8f4', transition:'color 0.1s' }}>★</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {card.notes.length>0 && <span style={{ fontSize:9, padding:'1px 5px', background:'rgba(26,58,143,0.08)', color:V.accent, borderRadius:4 }}>📝{card.notes.length}</span>}
          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:pill.bg, color:pill.color, fontWeight:600 }}>
            {card.score>=85?'Top':card.score>=70?'Ok':'Baixo'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Modal manual ─────────────────────────────────────────────────
function ModalNovoCard({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ name:'', role:'', vaga_titulo:'', stage:0, score:70 });
  const [err, setErr]   = useState('');
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleAdd = () => {
    if (!form.name.trim()) { setErr('Informe o nome'); return; }
    if (!form.role.trim()) { setErr('Informe o cargo'); return; }
    const initials = form.name.trim().split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const palette  = [V.accent,V.accent2,V.accent3,V.green,'#c96a00'];
    onAdd({ id:Date.now(), name:form.name.trim(), role:form.role.trim(),
      vaga_titulo:form.vaga_titulo||'Manual', stage:Number(form.stage),
      score:Number(form.score), initials, color:palette[Math.floor(Math.random()*palette.length)],
      notes:[], rating:0, created_at:new Date().toISOString() });
    setForm({ name:'', role:'', vaga_titulo:'', stage:0, score:70 }); setErr(''); onClose();
  };

  if (!open) return null;
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget){ setErr(''); onClose(); } }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:400, maxWidth:'95vw', animation:'fadeUp 0.25s ease' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>Adicionar Candidato</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20 }}>Inserção manual no funil</div>
        {err && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:V.red, marginBottom:14 }}>{err}</div>}
        {[['name','Nome *','Ana Lima'],['role','Cargo *','Dev Frontend'],['vaga_titulo','Vaga','Dev Sênior Backend']].map(([k,l,p])=>(
          <div key={k} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>{l}</label>
            <input value={form[k]} onChange={set(k)} placeholder={p}
              style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Etapa</label>
            <select value={form.stage} onChange={set('stage')} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}>
              {STAGES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Score: <strong style={{color:scoreColor(form.score)}}>{form.score}</strong></label>
            <input type="range" min={0} max={100} value={form.score} onChange={set('score')} style={{ width:'100%', marginTop:8, accentColor:V.accent }}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={()=>{ setErr(''); onClose(); }} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleAdd} style={{ background:V.accent, border:'none', color:'white', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>➕ Adicionar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────
export default function PanelFunil() {
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(null);
  const [dragOver, setDragOver]   = useState(null);
  const [detail, setDetail]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState('');
  const [filterVaga, setFilterVaga] = useState('Todas');
  const [lastUpdate, setLastUpdate] = useState(null);

  // ── Busca candidaturas da empresa ─────────────────────────────
  const fetchCandidaturas = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      // Mesmo padrão do CandidatoDashboard — só muda o endpoint
      const res = await fetch(`${BASE}/vagas/empresa/candidaturas`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data ?? []);
      setCards(list.map(apiToCard));
      setLastUpdate(new Date());
      setError('');
    } catch(e) {
      setError('Não foi possível carregar da API. Dados locais mantidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidaturas();
    // Polling a cada 60s — captura novas candidaturas sem refresh manual
    const t = setInterval(fetchCandidaturas, 60_000);
    return () => clearInterval(t);
  }, [fetchCandidaturas]);

  // ── Persistir stage na API (mesmo padrão do candidato) ────────
  const persistStage = async (cardId, stageId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const BASE   = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
    const status = STAGE_TO_STATUS[stageId];
    try {
      await fetch(`${BASE}/candidaturas/${cardId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ stage:stageId, status }),
      });
    } catch { /* silencia — state local já atualizado */ }
  };

  // ── Drag & Drop ───────────────────────────────────────────────
  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (dragging===null) return;
    setCards(prev=>prev.map(c=>c.id===dragging?{...c,stage:stageId}:c));
    setDetail(prev=>prev?.id===dragging?{...prev,stage:stageId}:prev);
    persistStage(dragging, stageId);
    setDragging(null); setDragOver(null);
  };

  // ── Atualizar card (notas, avaliação, mover) ─────────────────
  const updateCard = async (updated) => {
    const prev = cards.find(c=>c.id===updated.id);
    setCards(p=>p.map(c=>c.id===updated.id?updated:c));
    setDetail(updated);
    if (prev && prev.stage!==updated.stage) await persistStage(updated.id, updated.stage);
  };

  const updateRating = (cardId, rating) => {
    setCards(p=>p.map(c=>c.id===cardId?{...c,rating}:c));
    setDetail(p=>p?.id===cardId?{...p,rating}:p);
  };

  // ── Filtros ───────────────────────────────────────────────────
  const vagaOpts = ['Todas', ...new Set(cards.map(c=>c.vaga_titulo).filter(Boolean))];

  const filtered = cards.filter(c=>{
    const q = search.trim().toLowerCase();
    return (!q || (c.name+c.role+c.vaga_titulo).toLowerCase().includes(q))
      && (filterVaga==='Todas' || c.vaga_titulo===filterVaga);
  });

  const novos  = cards.filter(c=>c.stage===0).length;
  const hired  = cards.filter(c=>c.stage===5).length;
  const rate   = cards.length ? Math.round(hired/cards.length*100) : 0;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:16 }}>
      <div style={{ width:36, height:36, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
      <style>{`@keyframes clSpin{to{transform:rotate(360deg);}}`}</style>
      <p style={{ color:V.muted, fontSize:14 }}>Carregando candidaturas...</p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideRight{from{transform:translateX(40px);opacity:0;}to{transform:translateX(0);opacity:1;}}
      `}</style>

      {error && (
        <div style={{ background:'rgba(224,123,0,0.08)', border:`1px solid rgba(224,123,0,0.25)`, borderRadius:10, padding:'10px 16px', fontSize:12, color:'#92400e', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          ⚠️ {error}
          <button onClick={fetchCandidaturas} style={{ marginLeft:'auto', background:V.accent, border:'none', color:'white', padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:11 }}>Tentar novamente</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:V.text }}>Funil de Recrutamento</div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>
            {cards.length} candidatos · {novos} novos · {hired} contratados · {rate}% conversão
            {lastUpdate && <span style={{ marginLeft:8 }}>· {lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..."
            style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:8, padding:'7px 12px', color:V.text, fontSize:12, outline:'none', width:150 }}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          <button onClick={fetchCandidaturas} title="Atualizar"
            style={{ background:V.surface, border:`1px solid ${V.border}`, color:V.muted, padding:'7px 11px', borderRadius:8, cursor:'pointer', fontSize:13 }}>↻</button>
          <button onClick={()=>setModalOpen(true)}
            style={{ background:V.accent, border:'none', color:'white', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}
            onMouseEnter={e=>e.currentTarget.style.background='#0f2460'}
            onMouseLeave={e=>e.currentTarget.style.background=V.accent}>
            + Manual
          </button>
        </div>
      </div>

      {/* Filtro por vaga */}
      {vagaOpts.length > 2 && (
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {vagaOpts.map(v=>(
            <button key={v} onClick={()=>setFilterVaga(v)}
              style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer',
                border:`1px solid ${filterVaga===v?V.accent:V.border}`,
                background:filterVaga===v?V.accent:'none',
                color:filterVaga===v?'white':V.muted2, transition:'all 0.15s' }}>
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Board */}
      <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
        {STAGES.map(stage=>{
          const stageCards = filtered.filter(c=>c.stage===stage.id);
          const isOver     = dragOver===stage.id;
          return (
            <div key={stage.id}
              onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; setDragOver(stage.id); }}
              onDrop={e=>handleDrop(e,stage.id)}
              onDragLeave={()=>setDragOver(null)}
              style={{ background:isOver?'rgba(26,58,143,0.03)':V.surface,
                border:`1px solid ${isOver?'rgba(26,58,143,0.35)':V.border}`,
                borderRadius:12, padding:12, minWidth:196, width:196, flexShrink:0,
                minHeight:400, transition:'all 0.15s',
                outline:isOver?`2px dashed rgba(26,58,143,0.28)`:undefined }}>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:stage.color }}/>
                  <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:stage.color }}>{stage.name}</span>
                </div>
                <span style={{ width:20, height:20, borderRadius:6, background:V.surface2, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', color:V.muted2 }}>{stageCards.length}</span>
              </div>

              {stageCards.length===0 && (
                <div style={{ border:`2px dashed ${V.border}`, borderRadius:8, padding:'18px 0', textAlign:'center', color:V.muted2, fontSize:11, marginBottom:8 }}>
                  {stage.id===0?'⏳ Aguardando':'Arraste aqui'}
                </div>
              )}

              {stageCards.map(card=>(
                <KanbanCard key={card.id} card={card} stageColor={stage.color}
                  onDragStart={id=>setDragging(id)}
                  onOpenDetail={setDetail}
                  onRating={updateRating}/>
              ))}

              <button onClick={()=>setModalOpen(true)}
                style={{ width:'100%', background:'none', border:`1px dashed ${V.border}`, color:V.muted2, borderRadius:8, padding:'6px 0', fontSize:10, cursor:'pointer', marginTop:4, transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=stage.color; e.currentTarget.style.color=stage.color; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=V.border; e.currentTarget.style.color=V.muted2; }}>
                + card
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize:11, color:V.muted2, marginTop:8 }}>
        📋 Vaga no card · ★ Avaliação · 📝 Notas · Clique para detalhes · Arraste para mover etapa
        {cards.length===0 && <span style={{ color:V.orange }}> · Publique vagas para receber candidaturas!</span>}
      </div>

      <ModalNovoCard open={modalOpen} onClose={()=>setModalOpen(false)} onAdd={c=>setCards(p=>[...p,c])}/>
      {detail && <CardDetail card={detail} onClose={()=>setDetail(null)} onUpdate={updateCard}/>}
    </div>
  );
}