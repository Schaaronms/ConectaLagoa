// PanelAgenda.jsx — Conecta Lagoa
// Agenda funcional: calendário navegável, CRUD de eventos, integração API real
import { useState, useEffect, useCallback } from 'react';

const V = {
  bg:'#f4f6fb', surface:'#ffffff', surface2:'#f0f3fa', border:'#e2e8f4',
  accent:'#1a3a8f', accent2:'#2d52c4', accent3:'#e07b00',
  green:'#10b981', orange:'#e07b00', red:'#ef4444',
  text:'#1a1f36', muted:'#6b7280', muted2:'#9ca3af',
};

const TIPO_CONFIG = {
  'Triagem':    { bg:'rgba(26,58,143,0.1)',   color:'#1a3a8f' },
  'Entrevista': { bg:'rgba(224,123,0,0.12)',  color:'#e07b00' },
  'Técnico':    { bg:'rgba(201,106,0,0.12)',  color:'#c96a00' },
  'Proposta':   { bg:'rgba(16,185,129,0.12)', color:'#10b981' },
  'Feedback':   { bg:'rgba(239,68,68,0.1)',   color:'#ef4444' },
  'Lembrete':   { bg:'rgba(107,114,128,0.1)', color:'#6b7280' },
};

const TIPOS   = Object.keys(TIPO_CONFIG);
const FORMATOS = ['Presencial','Video Call','Google Meet','Teams','Telefone'];
const MESES   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const BASE    = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';

function authH() {
  return { 'Content-Type':'application/json', 'Authorization':`Bearer ${localStorage.getItem('token')}` };
}

function pad2(n) { return String(n).padStart(2,'0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function formatHour(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const hoje = toDateStr(new Date());
  if (dateStr === hoje) return `Hoje — ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const amanha = new Date(); amanha.setDate(amanha.getDate()+1);
  if (dateStr === toDateStr(amanha)) return `Amanhã — ${d.getDate()} de ${MESES[d.getMonth()]}`;
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

// ─── Modal criar/editar evento ────────────────────────────────────
function ModalEvento({ evento, onClose, onSaved, onDeleted }) {
  const editing = !!evento?.id;
  const EMPTY = {
    titulo:'', candidato_nome:'', data_hora:'', tipo:'Entrevista',
    formato:'Video Call', observacao:'', lembrete_min:30,
  };
  const [form, setForm]   = useState(editing ? {
    titulo:        evento.titulo        || '',
    candidato_nome:evento.candidato_nome|| '',
    data_hora:     evento.data_hora ? evento.data_hora.slice(0,16) : '',
    tipo:          evento.tipo          || 'Entrevista',
    formato:       evento.formato       || 'Video Call',
    observacao:    evento.observacao    || '',
    lembrete_min:  evento.lembrete_min  || 30,
  } : EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err,      setErr]      = useState('');

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    if (!form.titulo.trim())    { setErr('Informe o título'); return; }
    if (!form.data_hora)        { setErr('Informe a data e hora'); return; }
    setSaving(true); setErr('');
    try {
      const url    = editing ? `${BASE}/agenda/${evento.id}` : `${BASE}/agenda`;
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers:authH(), body:JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setErr(data.error || 'Erro ao salvar'); setSaving(false); return; }
      onSaved(data);
    } catch { setErr('Erro de conexão'); setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remover este evento?')) return;
    setDeleting(true);
    try {
      await fetch(`${BASE}/agenda/${evento.id}`, { method:'DELETE', headers:authH() });
      onDeleted(evento.id);
    } catch { setDeleting(false); }
  };

  const inputStyle = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none', fontFamily:'inherit' };
  const labelStyle = { fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.32)', backdropFilter:'blur(5px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, borderRadius:16, padding:28, width:460, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', animation:'fadeUp 0.25s ease', border:`1px solid ${V.border}` }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>
          {editing ? 'Editar Evento' : '+ Novo Evento'}
        </div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20 }}>
          {editing ? 'Atualize os dados do agendamento' : 'Agende uma entrevista ou lembrete'}
        </div>

        {err && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:V.red, marginBottom:14 }}>{err}</div>}

        {/* Título */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Título *</label>
          <input value={form.titulo} onChange={set('titulo')} placeholder="ex: Entrevista — Ana Lima"
            style={inputStyle} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        {/* Candidato */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Candidato</label>
          <input value={form.candidato_nome} onChange={set('candidato_nome')} placeholder="Nome do candidato (opcional)"
            style={inputStyle} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        {/* Data + Hora */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Data e Hora *</label>
          <input type="datetime-local" value={form.data_hora} onChange={set('data_hora')}
            style={inputStyle}/>
        </div>

        {/* Tipo + Formato */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Tipo</label>
            <select value={form.tipo} onChange={set('tipo')} style={inputStyle}>
              {TIPOS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Formato</label>
            <select value={form.formato} onChange={set('formato')} style={inputStyle}>
              {FORMATOS.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Lembrete */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Lembrete</label>
          <select value={form.lembrete_min} onChange={set('lembrete_min')} style={inputStyle}>
            {[[0,'Sem lembrete'],[15,'15 minutos antes'],[30,'30 minutos antes'],[60,'1 hora antes'],[1440,'1 dia antes']].map(([v,l])=>(
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Observação */}
        <div style={{ marginBottom:22 }}>
          <label style={labelStyle}>Observação</label>
          <textarea value={form.observacao} onChange={set('observacao')} rows={2}
            placeholder="Link da call, endereço, notas..."
            style={{ ...inputStyle, resize:'vertical' }}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'space-between' }}>
          {editing && (
            <button onClick={handleDelete} disabled={deleting}
              style={{ background:'none', border:`1px solid rgba(239,68,68,0.3)`, color:V.red, padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
              {deleting ? 'Removendo...' : '🗑 Remover'}
            </button>
          )}
          <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
            <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              style={{ background:saving?V.muted2:V.accent, border:'none', color:'white', padding:'8px 20px', borderRadius:8, cursor:saving?'default':'pointer', fontSize:12, fontWeight:600 }}
              onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#0f2460'; }}
              onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=V.accent; }}>
              {saving ? 'Salvando...' : editing ? '💾 Salvar' : '📅 Agendar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────
export default function PanelAgenda() {
  const today = new Date();
  const [viewDate,   setViewDate]   = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(toDateStr(today));
  const [dayEvents,  setDayEvents]  = useState([]);
  const [eventDays,  setEventDays]  = useState({}); // { dia: total }
  const [loading,    setLoading]    = useState(false);
  const [loadingCal, setLoadingCal] = useState(false);
  const [modal,      setModal]      = useState(false);
  const [editEvento, setEditEvento] = useState(null);

  const ano = viewDate.getFullYear();
  const mes = viewDate.getMonth(); // 0-based

  // ── Carrega dias com eventos do mês (pontos no calendário) ────
  const fetchMes = useCallback(async (a, m) => {
    setLoadingCal(true);
    try {
      const res  = await fetch(`${BASE}/agenda/mes?ano=${a}&mes=${m+1}`, { headers:authH() });
      const data = await res.json();
      setEventDays(data || {});
    } catch { setEventDays({}); } finally { setLoadingCal(false); }
  }, []);

  // ── Carrega eventos do dia selecionado ────────────────────────
  const fetchDia = useCallback(async (dateStr) => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/agenda/dia?data=${dateStr}`, { headers:authH() });
      const data = await res.json();
      setDayEvents(Array.isArray(data) ? data : []);
    } catch { setDayEvents([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMes(ano, mes); }, [ano, mes, fetchMes]);
  useEffect(() => { fetchDia(selectedDay); }, [selectedDay, fetchDia]);

  // ── Navegação de mês ──────────────────────────────────────────
  const prevMes = () => setViewDate(new Date(ano, mes-1, 1));
  const nextMes = () => setViewDate(new Date(ano, mes+1, 1));

  // ── Callbacks de CRUD ─────────────────────────────────────────
  const onSaved = (evento) => {
    setModal(false); setEditEvento(null);
    const dia = new Date(evento.data_hora);
    const diaStr = toDateStr(dia);
    // Atualiza dias com ponto
    fetchMes(ano, mes);
    // Atualiza lista do dia se for o dia selecionado
    if (diaStr === selectedDay) fetchDia(selectedDay);
  };

  const onDeleted = (id) => {
    setDayEvents(prev => prev.filter(e => e.id !== id));
    setModal(false); setEditEvento(null);
    fetchMes(ano, mes);
  };

  // ── Construção do calendário ──────────────────────────────────
  const diasNoMes  = new Date(ano, mes+1, 0).getDate();
  const primeiroDay = new Date(ano, mes, 1).getDay(); // 0=Dom
  const cells = [];
  const prevDias = new Date(ano, mes, 0).getDate();
  for (let i = 0; i < primeiroDay; i++) cells.push({ day: prevDias-primeiroDay+i+1, other:true });
  for (let d = 1; d <= diasNoMes; d++) {
    const dStr = `${ano}-${pad2(mes+1)}-${pad2(d)}`;
    cells.push({ day:d, dStr, today: dStr===toDateStr(today), selected: dStr===selectedDay, hasEvent: !!eventDays[d] });
  }
  // Completa última semana
  const resto = 7 - (cells.length % 7);
  if (resto < 7) for (let i=1; i<=resto; i++) cells.push({ day:i, other:true });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}`}</style>

      {/* ── Coluna esquerda: calendário ── */}
      <div>
        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, padding:18 }}>

          {/* Cabeçalho mês */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <button onClick={prevMes} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:V.text }}>
              {MESES[mes]} {ano}
              {loadingCal && <span style={{ fontSize:10, color:V.muted2, marginLeft:6 }}>...</span>}
            </div>
            <button onClick={nextMes} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>

          {/* Dias da semana */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {['D','S','T','Q','Q','S','S'].map((d,i)=>(
              <div key={i} style={{ fontSize:9, textAlign:'center', color:V.muted, textTransform:'uppercase', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Grid dias */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {cells.map((c,i) => (
              <div key={i}
                onClick={()=>{ if(!c.other && c.dStr) setSelectedDay(c.dStr); }}
                style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, borderRadius:6, cursor: c.other ? 'default' : 'pointer',
                  position:'relative', transition:'all 0.15s',
                  background: c.today ? V.accent : c.selected ? `${V.accent}18` : 'transparent',
                  color: c.today ? 'white' : c.other ? '#d1d9f0' : V.text,
                  fontWeight: c.today || c.selected ? 700 : 400,
                  border: c.selected && !c.today ? `1px solid ${V.accent}` : '1px solid transparent',
                }}
                onMouseEnter={e=>{ if(!c.other && !c.today) e.currentTarget.style.background=`${V.accent}10`; }}
                onMouseLeave={e=>{ if(!c.other && !c.today && !c.selected) e.currentTarget.style.background='transparent'; }}>
                {c.day}
                {c.hasEvent && !c.today && (
                  <span style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, background:V.orange, borderRadius:'50%' }}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={()=>{ setEditEvento(null); setModal(true); }}
            style={{ width:'100%', background:V.accent, border:'none', color:'white', padding:'10px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#0f2460'}
            onMouseLeave={e=>e.currentTarget.style.background=V.accent}>
            + Agendar Entrevista
          </button>
          <button onClick={()=>{ setEditEvento({tipo:'Lembrete'}); setModal(true); }}
            style={{ width:'100%', background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'9px', borderRadius:8, cursor:'pointer', fontSize:12, transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=V.accent; e.currentTarget.style.color=V.accent; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=V.border; e.currentTarget.style.color=V.muted2; }}>
            🔔 Definir Lembrete
          </button>
        </div>
      </div>

      {/* ── Coluna direita: eventos do dia ── */}
      <div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, marginBottom:14, color:V.text }}>
          {formatDateLabel(selectedDay)}
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'24px 0', color:V.muted, fontSize:13 }}>
            <div style={{ width:20, height:20, border:`2px solid ${V.border}`, borderTop:`2px solid ${V.accent}`, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            Carregando eventos...
          </div>
        ) : dayEvents.length === 0 ? (
          <div style={{ padding:'32px 0', textAlign:'center', color:V.muted2 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📅</div>
            <div style={{ fontSize:14, fontWeight:600, color:V.muted, marginBottom:6 }}>Nenhum evento neste dia</div>
            <div style={{ fontSize:12, color:V.muted2, marginBottom:16 }}>Clique em "+ Agendar Entrevista" para adicionar</div>
            <button onClick={()=>{ setEditEvento(null); setModal(true); }}
              style={{ background:V.accent, border:'none', color:'white', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>
              + Agendar para este dia
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {dayEvents.map((ev, i) => {
              const pill = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG['Entrevista'];
              return (
                <div key={ev.id} onClick={()=>{ setEditEvento(ev); setModal(true); }}
                  style={{ display:'flex', gap:14, background:V.surface, border:`1px solid ${V.border}`, borderRadius:10, padding:'14px 16px', alignItems:'center', cursor:'pointer', animation:`fadeUp 0.35s ease ${i*0.06}s both`, transition:'all 0.18s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(26,58,143,0.25)'; e.currentTarget.style.transform='translateX(2px)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=V.border; e.currentTarget.style.transform=''; }}>

                  {/* Hora */}
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, minWidth:46, color:V.accent }}>
                    {formatHour(ev.data_hora)}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:V.text, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {ev.titulo}
                    </div>
                    <div style={{ fontSize:11, color:V.muted }}>
                      {[ev.candidato_nome, ev.formato].filter(Boolean).join(' · ')}
                    </div>
                    {ev.observacao && (
                      <div style={{ fontSize:10, color:V.muted2, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {ev.observacao}
                      </div>
                    )}
                  </div>

                  {/* Badge tipo */}
                  <span style={{ padding:'4px 10px', borderRadius:6, fontSize:10, fontWeight:600, background:pill.bg, color:pill.color, flexShrink:0 }}>
                    {ev.tipo}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ModalEvento
          evento={editEvento}
          onClose={()=>{ setModal(false); setEditEvento(null); }}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
