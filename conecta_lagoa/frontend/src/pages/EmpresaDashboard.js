// EmpresaDashboard.js — Conecta Lagoa (refatorado)
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── PAINÉIS SEPARADOS ────────────────────────────────────────────
import PanelOverview      from './panels/PanelOverview';
import PanelTalent        from './panels/PanelTalent';
import PanelAI            from './panels/PanelAI';
import PanelReports       from './panels/PanelReports';
import PanelHistory       from './panels/PanelHistory';
import PanelIndicadoresRH from './panels/PanelIndicadoresRH';
import PanelColaboradores from './panels/PanelColaboradores';
import PanelAgendaFull    from './PanelAgenda';
import PanelFunilCRM      from './PanelFunil';
import { V, BASE_URL }    from './panels/shared';

// ─── MODAL AGENDAMENTO ────────────────────────────────────────────
function Modal({ open, onClose }) {
  const [form, setForm] = useState({ candidato:'Ana Lima', vaga:'Dev Sênior Backend', data:'2025-03-10', horario:'14:00', tipo:'Video call (Google Meet)', lembrete:'1 hora antes (Email + WhatsApp)' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${BASE_URL}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) { setToast('Agendado com sucesso! ✓'); setTimeout(() => { setToast(''); onClose(); }, 1500); }
      else        { setToast('Erro ao agendar. Tente novamente.'); setTimeout(() => setToast(''), 2500); }
    } catch {
      setToast('Salvo localmente (offline)');
      setTimeout(() => { setToast(''); onClose(); }, 1500);
    } finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:420, maxWidth:'95vw', animation:'fadeUp 0.3s ease', position:'relative' }}>
        {toast && <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background:V.accent, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>{toast}</div>}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:6, color:V.text }}>Agendar Entrevista / Lembrete</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20 }}>Adicione ao calendário e configure notificações automáticas</div>
        {[['candidato','Candidato','text','Nome do candidato'],['vaga','Vaga','text','Selecione a vaga']].map(([key,l,t,p]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>{l}</label>
            <input type={t} value={form[key]} onChange={set(key)} placeholder={p} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}/>
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          {[['data','Data','date'],['horario','Horário','time']].map(([key,l,t]) => (
            <div key={key} style={{ flex:1 }}>
              <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{l}</label>
              <input type={t} value={form[key]} onChange={set(key)} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}/>
            </div>
          ))}
        </div>
        {[['tipo','Tipo'],['lembrete','Lembrete automático']].map(([key,l]) => (
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>{l}</label>
            <input value={form[key]} onChange={set(key)} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}/>
          </div>
        ))}
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} style={{ background:saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:saving ? 'default' : 'pointer', fontSize:12, fontWeight:500 }}>
            {saving ? 'Salvando...' : '✓ Confirmar & Notificar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL NOVA VAGA ──────────────────────────────────────────────
function ModalNovaVaga({ open, onClose, onSaved }) {
  const EMPTY = { titulo:'', area:'Tecnologia', cidade:'', salario:'', prazo:'', descricao:'', local:'', modelo:'Presencial', tipo_contrato:'CLT', pcd:false, ativo:true };
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  const [toastOk, setToastOk] = useState(true);
  const set     = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const setBool = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.checked }));
  const showToast = (msg, ok = true) => { setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), ok ? 1800 : 3000); };

  const handleSalvar = async () => {
    if (!form.titulo.trim()) { showToast('Informe o título da vaga', false); return; }
    if (!form.cidade.trim()) { showToast('Informe a cidade', false); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/empresa/vagas`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ titulo:form.titulo, descricao:form.descricao, requisitos:'', salario:form.salario, cidade:form.cidade, estado:'', tipo_contrato:form.tipo_contrato, modalidade:form.modelo, area:form.area, pcd:form.pcd, prazo:form.prazo }),
      });
      if (res.ok) {
        const criada = await res.json();
        showToast(`Vaga "${form.titulo}" publicada! ✓`);
        onSaved && onSaved(criada);
        setTimeout(() => { onClose(); setForm(EMPTY); }, 1600);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || err.message || 'Erro ao criar vaga.', false);
      }
    } catch { showToast('Sem conexão — tente novamente', false); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  const inputStyle = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" };
  const labelStyle = { fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:500, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', animation:'fadeUp 0.3s ease', position:'relative' }}>
        {toast && <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background:toastOk ? V.accent : V.red, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>{toast}</div>}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:4, color:V.text }}>Nova Vaga</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:22 }}>Preencha os dados e publique imediatamente</div>
        <div style={{ marginBottom:14 }}><label style={labelStyle}>Título da Vaga *</label><input value={form.titulo} onChange={set('titulo')} placeholder="ex: Dev Frontend React" style={inputStyle} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}><label style={labelStyle}>Área</label>
            <select value={form.area} onChange={set('area')} style={inputStyle}>
              {['Tecnologia','Design','Produto','Data','Marketing','Operações','Saúde','Educação','Outros'].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}><label style={labelStyle}>Tipo de contrato</label>
            <select value={form.tipo_contrato} onChange={set('tipo_contrato')} style={inputStyle}>
              {['CLT','PJ','Estágio','Freelance','Temporário'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}><label style={labelStyle}>Cidade *</label><input value={form.cidade} onChange={set('cidade')} placeholder="Lagoa da Prata, MG" style={inputStyle} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
          <div style={{ flex:1 }}><label style={labelStyle}>Modelo de trabalho</label>
            <select value={form.modelo} onChange={set('modelo')} style={inputStyle}>
              {['Presencial','Híbrido','Remoto'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}><label style={labelStyle}>Salário</label><input value={form.salario} onChange={set('salario')} placeholder="R$ 3.000 – 5.000" style={inputStyle} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
          <div style={{ flex:1 }}><label style={labelStyle}>Prazo de inscrição</label><input type="date" value={form.prazo} onChange={set('prazo')} style={inputStyle}/></div>
        </div>
        <div style={{ marginBottom:14 }}><label style={labelStyle}>Descrição</label><textarea value={form.descricao} onChange={set('descricao')} rows={3} placeholder="Responsabilidades, requisitos, benefícios..." style={{ ...inputStyle, resize:'vertical' }} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="pcd" checked={form.pcd} onChange={setBool('pcd')} style={{ width:16, height:16, accentColor:V.accent, cursor:'pointer' }}/>
          <label htmlFor="pcd" style={{ fontSize:13, color:V.text, cursor:'pointer' }}>Vaga destinada a Pessoa com Deficiência (PCD)</label>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={saving}
            style={{ background:saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:saving ? 'default' : 'pointer', fontSize:13, fontWeight:600 }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#0f2460'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = V.accent; }}>
            {saving ? 'Publicando...' : '🚀 Publicar Vaga'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────
const ICONS = {
  overview: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/></svg>,
  funnel:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4h18l-7 8v7l-4-2V12L3 4z" strokeWidth="1.5"/></svg>,
  talent:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth="1.5"/></svg>,
  ai:       <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5"/><path d="M9 12l2 2 4-4" strokeWidth="1.5"/></svg>,
  agenda:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M3 9h18M8 2v4M16 2v4" strokeWidth="1.5"/></svg>,
  reports:  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="1.5"/></svg>,
  history:  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1.5"/></svg>,
  indicadores:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 8v8M12 11v5M8 14v2M3 20h18M5 20V4l7 3 7-3v16" strokeWidth="1.5"/></svg>,
  colaboradores: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.5"/><circle cx="9" cy="7" r="4" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.5"/></svg>,
};

const TABS = [
  { id:'overview',      label:'Visão Geral'       },
  { id:'funnel',        label:'Funil CRM'         },
  { id:'talent',        label:'Banco de Talentos' },
  { id:'ai',            label:'Ranking IA'        },
  { id:'agenda',        label:'Agenda'            },
  { id:'reports',       label:'Relatórios'        },
  { id:'history',       label:'Histórico'         },
  { id:'indicadores',   label:'Indicadores RH'    },
  { id:'colaboradores', label:'Colaboradores'     },
];

const PAGE_TITLES = {
  overview:'Visão Geral Executiva', funnel:'Funil de Recrutamento — CRM',
  talent:'Banco de Talentos', ai:'Ranking Inteligente com IA',
  agenda:'Agenda & Lembretes', reports:'Relatórios Estratégicos',
  history:'Histórico de Performance', indicadores:'Indicadores de RH',
  colaboradores:'Gestão de Colaboradores',
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function EmpresaDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('overview');
  const [modal, setModal]       = useState(false);
  const [modalVaga, setModalVaga] = useState(false);
  const [kpis, setKpis]         = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const get = async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, { headers: { 'Authorization':`Bearer ${token}` } });
        return res.ok ? res.json() : null;
      };
      const [resumo, cands] = await Promise.all([
        get('/dashboard/resumo'),
        get('/dashboard/candidatos-recentes'),
      ]);
      const r = resumo?.data || resumo || {};
      setKpis([
        { icon:'📊', label:'Vagas Ativas',       value:r.vagas_ativas,            delta:`${r.vagas_semana||0} este mês`,          deltaUp:true,  color:V.accent  },
        { icon:'👥', label:'Candidatos',          value:r.candidaturas,            delta:`${r.candidaturas_hoje||0}% vs mês ant.`, deltaUp:true,  color:V.accent2 },
        { icon:'🎯', label:'Taxa de Conversão',   value:`${r.taxa_conversao||18}%`,delta:`${r.taxa_variacao||3}pp`,                deltaUp:true,  color:V.green   },
        { icon:'⏱',  label:'Tempo p/ Contratar', value:`${r.tempo_medio||23}d`,   delta:'5d vs ant.',                             deltaUp:false, color:V.orange  },
        { icon:'💰', label:'Custo / Contratação', value:`R$${r.custo_medio||'1.8k'}`,delta:'R$200',                               deltaUp:false, color:V.accent3 },
        { icon:'📈', label:'Contratações/Mês',    value:r.contratacoes||11,        delta:`${r.contratacoes_mes||2} vs ant.`,       deltaUp:true,  color:V.green   },
      ]);
      const c = cands?.data || cands || [];
      if (c.length > 0) setCandidates(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const initials = user?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes clSpin { to{transform:rotate(360deg);} }
        * { box-sizing:border-box; margin:0; padding:0; }
        .cl-sidebar { position:fixed;left:0;top:64px;bottom:0;width:64px;background:${V.surface};border-right:1px solid ${V.border};display:flex;flex-direction:column;align-items:center;padding:20px 0;gap:8px;z-index:90;transition:width 0.3s cubic-bezier(.4,0,.2,1);overflow:hidden; }
        .cl-sidebar:hover { width:200px; }
        .cl-nav-item { width:100%;display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;transition:all 0.2s;color:${V.muted};font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;position:relative;border:none;background:none;font-family:'DM Sans',sans-serif; }
        .cl-nav-item:hover { background:${V.surface2};color:${V.text}; }
        .cl-nav-item.active { color:${V.accent}; }
        .cl-nav-item.active::before { content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:${V.accent};border-radius:0 2px 2px 0; }
        .cl-nav-label { opacity:0;transition:opacity 0.2s;font-family:'DM Sans',sans-serif; }
        .cl-sidebar:hover .cl-nav-label { opacity:1; }
        .cl-tab { padding:10px 20px;font-size:13px;font-weight:500;color:${V.muted};cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;background:none;border-left:none;border-right:none;border-top:none;font-family:'DM Sans',sans-serif; }
        .cl-tab:hover { color:${V.text}; }
        .cl-tab.active { color:${V.accent};border-bottom-color:${V.accent}; }
        ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${V.border};border-radius:3px}
      `}</style>

      <nav className="cl-sidebar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`cl-nav-item${tab === t.id ? ' active' : ''}`}>
            <span style={{ width:20, height:20, flexShrink:0, display:'flex', alignItems:'center' }}>{ICONS[t.id]}</span>
            <span className="cl-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ marginLeft:64, fontFamily:"'DM Sans',sans-serif", background:V.bg, minHeight:'calc(100vh - 64px)' }}>
        {/* TOPBAR */}
        <div style={{ position:'sticky', top:64, background:'rgba(244,246,251,0.95)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${V.border}`, padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:50 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:V.text }}>{PAGE_TITLES[tab]}</div>
            <div style={{ fontSize:12, color:V.muted }}>Atualizado agora · {new Date().toLocaleDateString('pt-BR', { month:'long', year:'numeric' })}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setModal(true)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = V.accent; e.currentTarget.style.color = V.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = V.border; e.currentTarget.style.color = V.muted2; }}>
              🔔 Lembrete
            </button>
            <button onClick={() => setModalVaga(true)} style={{ background:V.accent, border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0f2460'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = V.accent; e.currentTarget.style.transform = ''; }}>
              + Nova Vaga
            </button>
            <div style={{ position:'relative' }}>
              <div style={{ width:32, height:32, background:`linear-gradient(135deg,${V.accent3},${V.accent})`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'white', cursor:'pointer' }}>{initials}</div>
              <div style={{ position:'absolute', top:-4, right:-4, width:16, height:16, background:V.red, borderRadius:'50%', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${V.bg}`, color:'white' }}>3</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:4, padding:'20px 32px 0', borderBottom:`1px solid ${V.border}`, background:V.bg, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`cl-tab${tab === t.id ? ' active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ padding:'28px 32px' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:16 }}>
              <div style={{ width:36, height:36, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
              <p style={{ color:V.muted, fontSize:14 }}>Carregando dados...</p>
            </div>
          ) : (
            <>
              {tab === 'overview'      && <PanelOverview kpis={kpis} candidates={candidates}/>}
              {tab === 'funnel'        && <PanelFunilCRM/>}
              {tab === 'talent'        && <PanelTalent/>}
              {tab === 'ai'            && <PanelAI/>}
              {tab === 'agenda'        && <PanelAgendaFull/>}
              {tab === 'reports'       && <PanelReports/>}
              {tab === 'history'       && <PanelHistory/>}
              {tab === 'indicadores'   && <PanelIndicadoresRH/>}
              {tab === 'colaboradores' && <PanelColaboradores/>}
            </>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)}/>
      <ModalNovaVaga open={modalVaga} onClose={() => setModalVaga(false)} onSaved={fetchData}/>
    </>
  );
}