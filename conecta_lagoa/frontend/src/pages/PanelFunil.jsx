// PanelFunil.jsx — Conecta Lagoa
// Kanban completo: drag & drop nativo, adicionar candidatos, notas, avaliações
// Sem dependências externas — usa HTML5 Drag and Drop API
import { useState, useRef } from 'react';

// ─── PALETA (mesma do EmpresaDashboard) ───────────────────────────
const V = {
  bg:      '#f4f6fb', surface: '#ffffff', surface2: '#f0f3fa',
  border:  '#e2e8f4', accent:  '#1a3a8f', accent2:  '#2d52c4',
  accent3: '#e07b00', green:   '#10b981', orange:   '#e07b00',
  red:     '#ef4444', text:    '#1a1f36', muted:    '#6b7280', muted2: '#9ca3af',
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

const INITIAL_CARDS = [
  { id:1,  name:'Fernanda Costa',  role:'Data Analyst',    stage:0, score:67, initials:'FC', color:'#ef4444', notes:[], rating:0 },
  { id:2,  name:'Marcos Alves',    role:'Dev Backend',     stage:0, score:74, initials:'MA', color:'#2d52c4', notes:[], rating:0 },
  { id:3,  name:'Letícia Nunes',   role:'UX Designer',     stage:0, score:81, initials:'LN', color:'#e07b00', notes:[], rating:4 },
  { id:4,  name:'Bruna Dias',      role:'PM',              stage:1, score:79, initials:'BD', color:'#c96a00', notes:['Boa comunicação'], rating:3 },
  { id:5,  name:'Pedro Luz',       role:'Dev Frontend',    stage:1, score:88, initials:'PL', color:'#1a3a8f', notes:['Portfólio excelente'], rating:5 },
  { id:6,  name:'Sofia Ramos',     role:'Dev Sênior',      stage:2, score:94, initials:'SR', color:'#10b981', notes:['Referências confirmadas','Disponível em 15 dias'], rating:5 },
  { id:7,  name:'Carlos Mota',     role:'UX Designer',     stage:2, score:85, initials:'CM', color:'#e07b00', notes:[], rating:4 },
  { id:8,  name:'Juliana Rocha',   role:'PM',              stage:3, score:78, initials:'JR', color:'#c96a00', notes:['Teste enviado'], rating:3 },
  { id:9,  name:'Ana Lima',        role:'Dev Sênior',      stage:3, score:92, initials:'AL', color:'#1a3a8f', notes:['Top candidata'], rating:5 },
  { id:10, name:'Rafael Souza',    role:'Dev Backend',     stage:4, score:91, initials:'RS', color:'#10b981', notes:['Proposta enviada R$14k'], rating:5 },
  { id:11, name:'Tiago Faria',     role:'Dev Frontend',    stage:5, score:89, initials:'TF', color:'#059669', notes:['Início: 01/04'], rating:4 },
  { id:12, name:'Giovanna Silva',  role:'Data Engineer',   stage:6, score:55, initials:'GS', color:'#ef4444', notes:['Score baixo'], rating:2 },
];

// ─── HELPERS ──────────────────────────────────────────────────────
function scoreColor(s) { return s>=85 ? V.green : s>=70 ? V.orange : V.red; }
function pillClass(s)  { return s>=85 ? {bg:'rgba(16,185,129,0.12)',color:'#10b981'} : s>=70 ? {bg:'rgba(224,123,0,0.12)',color:'#e07b00'} : {bg:'rgba(239,68,68,0.12)',color:'#ef4444'}; }

function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={e=>{ e.stopPropagation(); onChange(i===value ? 0 : i); }}
          onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}
          style={{ fontSize:14, cursor:'pointer', color: (hover||value)>=i ? '#e07b00' : '#e2e8f4', transition:'color 0.1s', userSelect:'none' }}>★</span>
      ))}
    </div>
  );
}

// ─── CARD DETALHE (modal lateral) ────────────────────────────────
function CardDetail({ card, onClose, onUpdate, stageColor }) {
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (!newNote.trim()) return;
    onUpdate({ ...card, notes: [...card.notes, newNote.trim()] });
    setNewNote('');
  };
  const removeNote = (i) => onUpdate({ ...card, notes: card.notes.filter((_,idx)=>idx!==i) });

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.3)', backdropFilter:'blur(4px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
      <div style={{ width:400, height:'100%', background:V.surface, borderLeft:`1px solid ${V.border}`, display:'flex', flexDirection:'column', animation:'slideRight 0.25s ease' }}>
        <style>{`@keyframes slideRight{from{transform:translateX(40px);opacity:0;}to{transform:translateX(0);opacity:1;}}`}</style>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${card.color}22`, color:card.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700 }}>{card.initials}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:V.text }}>{card.name}</div>
              <div style={{ fontSize:12, color:V.muted, marginTop:2 }}>{card.role}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted, width:28, height:28, borderRadius:7, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* Stage badge */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 14px', background:V.surface2, borderRadius:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:stageColor }}/>
            <span style={{ fontSize:12, color:V.muted }}>Etapa atual:</span>
            <span style={{ fontSize:12, fontWeight:600, color:stageColor }}>{STAGES[card.stage].name}</span>
          </div>

          {/* Score */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Score IA</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:8, background:V.surface2, borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${card.score}%`, height:'100%', background:scoreColor(card.score), borderRadius:4, transition:'width 0.5s' }}/>
              </div>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:scoreColor(card.score), minWidth:36 }}>{card.score}</span>
            </div>
          </div>

          {/* Avaliação */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Sua Avaliação</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Stars value={card.rating} onChange={r=>onUpdate({...card, rating:r})}/>
              <span style={{ fontSize:12, color:V.muted }}>{card.rating > 0 ? `${card.rating}/5` : 'Sem avaliação'}</span>
            </div>
          </div>

          {/* Mover para etapa */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Mover para etapa</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {STAGES.map(s => (
                <button key={s.id} onClick={()=>onUpdate({...card, stage:s.id})}
                  style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer', border:`1px solid ${card.stage===s.id ? s.color : V.border}`, background: card.stage===s.id ? `${s.color}18` : 'none', color: card.stage===s.id ? s.color : V.muted2, transition:'all 0.15s' }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Notas & Observações</div>
            {card.notes.length === 0 && (
              <div style={{ fontSize:12, color:V.muted2, padding:'10px 0' }}>Nenhuma nota ainda.</div>
            )}
            {card.notes.map((n,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', background:V.surface2, borderRadius:8, marginBottom:8, fontSize:12 }}>
                <span style={{ flex:1, color:V.text, lineHeight:1.5 }}>{n}</span>
                <button onClick={()=>removeNote(i)} style={{ background:'none', border:'none', color:V.muted2, cursor:'pointer', fontSize:12, flexShrink:0, padding:'0 2px' }}>✕</button>
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

// ─── MODAL NOVO CANDIDATO ─────────────────────────────────────────
function ModalNovoCard({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ name:'', role:'', stage:0, score:70 });
  const [err, setErr]   = useState('');

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}));

  const handleAdd = () => {
    if (!form.name.trim()) { setErr('Informe o nome'); return; }
    if (!form.role.trim()) { setErr('Informe o cargo'); return; }
    const initials = form.name.trim().split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const colors   = [V.accent, V.accent2, V.accent3, V.green, '#c96a00'];
    onAdd({
      id: Date.now(),
      name: form.name.trim(), role: form.role.trim(),
      stage: Number(form.stage), score: Number(form.score),
      initials, color: colors[Math.floor(Math.random()*colors.length)],
      notes: [], rating: 0,
    });
    setForm({ name:'', role:'', stage:0, score:70 });
    setErr('');
    onClose();
  };

  if (!open) return null;
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget){ setErr(''); onClose(); } }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:400, maxWidth:'95vw', animation:'fadeUp 0.25s ease' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>Adicionar Candidato</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20 }}>Insira no funil de recrutamento</div>

        {err && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:V.red, marginBottom:14 }}>{err}</div>}

        {[['name','Nome completo *','text','Ana Lima'],['role','Cargo *','text','Dev Frontend']].map(([k,l,,p])=>(
          <div key={k} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>{l}</label>
            <input value={form[k]} onChange={set(k)} placeholder={p}
              style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
        ))}

        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Etapa inicial</label>
            <select value={form.stage} onChange={set('stage')}
              style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}>
              {STAGES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Score IA: <strong style={{color:scoreColor(form.score)}}>{form.score}</strong></label>
            <input type="range" min={0} max={100} value={form.score} onChange={set('score')}
              style={{ width:'100%', marginTop:8, accentColor:V.accent }}/>
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

// ─── KANBAN CARD ─────────────────────────────────────────────────
function KanbanCard({ card, stageColor, onDragStart, onOpenDetail, onRating }) {
  const pill = pillClass(card.score);
  return (
    <div draggable
      onDragStart={e=>{ e.dataTransfer.effectAllowed='move'; onDragStart(card.id); }}
      onClick={()=>onOpenDetail(card)}
      style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:10, padding:12, marginBottom:8, cursor:'grab', transition:'all 0.18s', userSelect:'none' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=stageColor; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(26,58,143,0.1)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=V.border; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>

      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${card.color}22`, color:card.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{card.initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:V.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
          <div style={{ fontSize:10, color:V.muted, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.role}</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <div style={{ flex:1, height:3, background:V.surface2, borderRadius:2 }}>
          <div style={{ width:`${card.score}%`, height:'100%', background:scoreColor(card.score), borderRadius:2 }}/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:scoreColor(card.score), minWidth:22 }}>{card.score}</span>
      </div>

      {/* Bottom row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div onClick={e=>e.stopPropagation()} style={{ display:'flex', gap:1 }}>
          {[1,2,3,4,5].map(i=>(
            <span key={i} onClick={e=>{ e.stopPropagation(); onRating(card.id, i===card.rating?0:i); }}
              style={{ fontSize:11, cursor:'pointer', color:card.rating>=i?'#e07b00':'#e2e8f4', transition:'color 0.1s' }}>★</span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {card.notes.length > 0 && (
            <span style={{ fontSize:9, padding:'1px 6px', background:'rgba(26,58,143,0.08)', color:V.accent, borderRadius:4 }}>
              📝 {card.notes.length}
            </span>
          )}
          <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:pill.bg, color:pill.color, fontWeight:600 }}>
            {card.score>=85?'Top':card.score>=70?'Ok':'Baixo'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL PRINCIPAL ─────────────────────────────────────────────
export default function PanelFunil() {
  const [cards, setCards]         = useState(INITIAL_CARDS);
  const [dragging, setDragging]   = useState(null);   // id do card sendo arrastado
  const [dragOver, setDragOver]   = useState(null);   // id da coluna em hover
  const [detail, setDetail]       = useState(null);   // card aberto no painel lateral
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState('');

  // ── Drag handlers ─────────────────────────────────────────────
  const handleDragStart = (cardId) => setDragging(cardId);

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stageId);
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (dragging === null) return;
    setCards(prev => prev.map(c => c.id === dragging ? { ...c, stage: stageId } : c));

    // Atualizar painel lateral se o card movido estava aberto
    setDetail(prev => prev?.id === dragging ? { ...prev, stage: stageId } : prev);

    // Chamar API (se disponível)
    const token = localStorage.getItem('token');
    if (token) {
      const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      fetch(`${BASE}/candidatos/${dragging}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ stage: stageId }),
      }).catch(() => {}); // silencia erro offline — state já foi atualizado
    }

    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => { setDragging(null); setDragOver(null); };

  // ── Update card (notas, avaliação, mover via painel) ──────────
  const updateCard = (updated) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    setDetail(updated);
  };

  const updateRating = (cardId, rating) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, rating } : c));
    setDetail(prev => prev?.id === cardId ? { ...prev, rating } : prev);
  };

  const addCard = (card) => setCards(prev => [...prev, card]);

  const removeCard = (cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    if (detail?.id === cardId) setDetail(null);
  };

  // ── Filtro de busca ───────────────────────────────────────────
  const filtered = search.trim()
    ? cards.filter(c => (c.name+c.role).toLowerCase().includes(search.toLowerCase()))
    : cards;

  // ── Stats ─────────────────────────────────────────────────────
  const total = cards.length;
  const hired = cards.filter(c=>c.stage===5).length;
  const rate  = total ? Math.round(hired/total*100) : 0;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        .col-drop-target { outline: 2px dashed rgba(26,58,143,0.35) !important; background: rgba(26,58,143,0.04) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:V.text }}>Funil de Recrutamento</div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>
            {total} candidatos · {hired} contratados · {rate}% conversão
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar..."
            style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:8, padding:'7px 12px', color:V.text, fontSize:12, outline:'none', width:160 }}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          <button onClick={()=>setModalOpen(true)}
            style={{ background:V.accent, border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#0f2460'}
            onMouseLeave={e=>e.currentTarget.style.background=V.accent}>
            + Adicionar Candidato
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
        {STAGES.map(stage => {
          const stageCards = filtered.filter(c => c.stage === stage.id);
          const isOver     = dragOver === stage.id;
          return (
            <div key={stage.id}
              onDragOver={e=>handleDragOver(e, stage.id)}
              onDrop={e=>handleDrop(e, stage.id)}
              onDragLeave={()=>setDragOver(null)}
              className={isOver ? 'col-drop-target' : ''}
              style={{
                background: V.surface, border:`1px solid ${isOver ? 'rgba(26,58,143,0.35)' : V.border}`,
                borderRadius:12, padding:12, minWidth:200, width:200, flexShrink:0,
                minHeight:420, transition:'all 0.15s',
                background: isOver ? 'rgba(26,58,143,0.03)' : V.surface,
              }}>

              {/* Column header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:stage.color }}>{stage.name}</span>
                </div>
                <span style={{ width:20, height:20, borderRadius:6, background:V.surface2, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', color:V.muted2 }}>{stageCards.length}</span>
              </div>

              {/* Drop hint when empty */}
              {stageCards.length === 0 && (
                <div style={{ border:`2px dashed ${V.border}`, borderRadius:8, padding:'20px 0', textAlign:'center', color:V.muted2, fontSize:11, marginBottom:8 }}>
                  Arraste aqui
                </div>
              )}

              {/* Cards */}
              {stageCards.map(card => (
                <KanbanCard key={card.id}
                  card={card}
                  stageColor={stage.color}
                  onDragStart={handleDragStart}
                  onOpenDetail={setDetail}
                  onRating={updateRating}
                />
              ))}

              {/* Quick-add button at bottom */}
              <button onClick={()=>setModalOpen(true)}
                style={{ width:'100%', background:'none', border:`1px dashed ${V.border}`, color:V.muted2, borderRadius:8, padding:'7px 0', fontSize:11, cursor:'pointer', marginTop:4, transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=stage.color; e.currentTarget.style.color=stage.color; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=V.border; e.currentTarget.style.color=V.muted2; }}>
                + card
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
        {[['Top candidato','rgba(16,185,129,0.12)','#10b981'],['Score ok','rgba(224,123,0,0.12)','#e07b00'],['Score baixo','rgba(239,68,68,0.12)','#ef4444']].map(([l,bg,c])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:V.muted2 }}>
            <span style={{ padding:'1px 8px', borderRadius:10, background:bg, color:c, fontSize:10 }}>{l}</span>
          </div>
        ))}
        <span style={{ fontSize:11, color:V.muted2, marginLeft:8 }}>· Clique num card para abrir detalhes · Arraste para mover de etapa</span>
      </div>

      {/* ── Modais ── */}
      <ModalNovoCard open={modalOpen} onClose={()=>setModalOpen(false)} onAdd={addCard}/>
      {detail && (
        <CardDetail
          card={detail}
          stageColor={STAGES[detail.stage]?.color || V.accent}
          onClose={()=>setDetail(null)}
          onUpdate={updateCard}
        />
      )}
    </div>
  );
}
