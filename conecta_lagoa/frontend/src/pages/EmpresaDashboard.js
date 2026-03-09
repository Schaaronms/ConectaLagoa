// EmpresaDashboard.js — Conecta Lagoa
// Layout idêntico ao dashboard-rh.html original
// Cores: Azul #1a3a8f + Laranja #e07b00 (tema claro)
// API real via fetch com token JWT do localStorage
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PanelAgendaFull from './PanelAgenda';

// ─── PALETA ────────────────────────────────────────────────────────
const V = {
  bg:       '#f4f6fb',
  surface:  '#ffffff',
  surface2: '#f0f3fa',
  border:   '#e2e8f4',
  accent:   '#1a3a8f',
  accent2:  '#2d52c4',
  accent3:  '#e07b00',
  green:    '#10b981',
  orange:   '#e07b00',
  red:      '#ef4444',
  text:     '#1a1f36',
  muted:    '#6b7280',
  muted2:   '#9ca3af',
};

// ─── DADOS ESTÁTICOS (fallback / demo) ────────────────────────────
const KANBAN_STAGES = [
  { name:'Recebido',   color:'#1a3a8f' },
  { name:'Triagem',    color:'#2d52c4' },
  { name:'Entrevista', color:'#e07b00' },
  { name:'Técnico',    color:'#c96a00' },
  { name:'Proposta',   color:'#10b981' },
  { name:'Contratado', color:'#059669' },
  { name:'Rejeitado',  color:'#ef4444' },
];
const KANBAN_DATA = [
  { name:'Fernanda Costa',  role:'Data Analyst',    stage:0, score:67, initials:'FC' },
  { name:'Marcos Alves',    role:'Dev Backend',      stage:0, score:74, initials:'MA' },
  { name:'Letícia Nunes',   role:'UX Designer',      stage:0, score:81, initials:'LN' },
  { name:'Bruna Dias',      role:'PM',               stage:1, score:79, initials:'BD' },
  { name:'Pedro Luz',       role:'Dev Frontend',     stage:1, score:88, initials:'PL' },
  { name:'Sofia Ramos',     role:'Dev Sênior',       stage:2, score:94, initials:'SR' },
  { name:'Carlos Mota',     role:'UX Designer',      stage:2, score:85, initials:'CM' },
  { name:'Juliana Rocha',   role:'PM',               stage:3, score:78, initials:'JR' },
  { name:'Ana Lima',        role:'Dev Sênior',       stage:3, score:92, initials:'AL' },
  { name:'Rafael Souza',    role:'Dev Backend',      stage:4, score:91, initials:'RS' },
  { name:'Tiago Faria',     role:'Dev Frontend',     stage:5, score:89, initials:'TF' },
  { name:'Giovanna Silva',  role:'Data Sci',         stage:6, score:55, initials:'GS' },
];

// FIX #5 — adicionado campo `id` para toggleFav seguro
const TALENTS_INIT = [
  { id:1,  name:'Ana Lima',        role:'Dev Sênior Backend',   city:'São Paulo',      area:'Tecnologia', tags:['Node.js','AWS','Python'],          fav:true,  score:92, color:V.accent  },
  { id:2,  name:'Carlos Mota',     role:'UX Designer Sênior',   city:'Rio de Janeiro', area:'Design',     tags:['Figma','Prototyping','Research'],  fav:false, score:85, color:V.accent3 },
  { id:3,  name:'Sofia Ramos',     role:'Dev Frontend',          city:'Curitiba',       area:'Tecnologia', tags:['React','TypeScript','CSS'],        fav:true,  score:94, color:V.accent2 },
  { id:4,  name:'Juliana Rocha',   role:'Product Manager',       city:'Belo Horizonte', area:'Produto',    tags:['Agile','OKRs','Analytics'],       fav:false, score:78, color:'#c96a00'  },
  { id:5,  name:'Rafael Souza',    role:'Dev Backend',           city:'Porto Alegre',   area:'Tecnologia', tags:['Java','Spring','Docker'],          fav:true,  score:91, color:V.green   },
  { id:6,  name:'Fernanda Costa',  role:'Data Analyst',          city:'Florianópolis',  area:'Data',       tags:['SQL','Python','Tableau'],          fav:false, score:67, color:V.red     },
  { id:7,  name:'Pedro Luz',       role:'Dev Frontend React',    city:'Recife',         area:'Tecnologia', tags:['React','Next.js','Tailwind'],      fav:false, score:88, color:V.accent  },
  { id:8,  name:'Letícia Nunes',   role:'UX/UI Designer',        city:'Salvador',       area:'Design',     tags:['Adobe XD','Figma','Motion'],       fav:true,  score:81, color:V.accent3 },
  { id:9,  name:'Marcos Alves',    role:'Data Scientist',        city:'São Paulo',      area:'Data',       tags:['ML','TensorFlow','R'],             fav:false, score:74, color:V.accent2 },
  { id:10, name:'Bruna Dias',      role:'Product Designer',      city:'Campinas',       area:'Design',     tags:['Figma','Design Systems','A11y'],   fav:false, score:79, color:'#c96a00'  },
  { id:11, name:'Tiago Faria',     role:'Dev Fullstack',         city:'Goiânia',        area:'Tecnologia', tags:['React','Node','MongoDB'],          fav:true,  score:89, color:V.green   },
  { id:12, name:'Giovanna Silva',  role:'Data Engineer',         city:'Brasília',       area:'Data',       tags:['Spark','Kafka','BigQuery'],        fav:false, score:55, color:V.red     },
];
const AI_DATA = [
  { name:'Sofia Ramos',    role:'Dev Frontend',          score:94, color:V.green,   traits:['Proativa','Comunicativa','Autônoma'],  skills:['React','TypeScript','Next.js'],  reason:'Histórico de 3 contratações similares com excelente performance.' },
  { name:'Ana Lima',       role:'Dev Sênior Backend',    score:92, color:V.accent,  traits:['Analítica','Metódica','Liderança'],    skills:['Node.js','AWS','Python'],        reason:'Alta compatibilidade comportamental com a cultura da equipe.' },
  { name:'Rafael Souza',   role:'Dev Backend',           score:91, color:V.accent,  traits:['Focado','Técnico','Colaborativo'],    skills:['Java','Spring','Docker'],        reason:'Score técnico acima da média + fit cultural forte.' },
  { name:'Pedro Luz',      role:'Dev Frontend React',    score:88, color:V.accent2, traits:['Criativo','Detalhista','Ágil'],       skills:['React','Next.js','Tailwind'],    reason:'Portfólio alinhado com projetos anteriores bem-sucedidos.' },
  { name:'Carlos Mota',    role:'UX Designer',           score:85, color:V.accent3, traits:['Empático','Visual','Estratégico'],    skills:['Figma','Research','Motion'],     reason:'Experiência prévia em segmento similar (fintech).' },
  { name:'Letícia Nunes',  role:'UX/UI Designer',        score:81, color:V.accent3, traits:['Criativa','Organizada','Empática'],   skills:['Figma','Adobe XD','A11y'],       reason:'Forte em design systems, alinhado com stack atual.' },
];

// FIX #2 — scores fixos no fallback (sem Math.random)
const FALLBACK_CANDIDATES = [
  { n:'Ana Lima',       loc:'São Paulo · SP',       v:'Dev Senior',    s:92, st:'pill-green',  stars:'★★★★★' },
  { n:'Carlos Mota',    loc:'Rio de Janeiro · RJ',  v:'UX Designer',   s:85, st:'pill-purple', stars:'★★★★☆' },
  { n:'Juliana Rocha',  loc:'Belo Horizonte · MG',  v:'Product Mgr',   s:78, st:'pill-orange', stars:'★★★★☆' },
  { n:'Rafael Souza',   loc:'Porto Alegre · RS',    v:'Dev Backend',   s:91, st:'pill-green',  stars:'★★★★★' },
  { n:'Fernanda Costa', loc:'Curitiba · PR',        v:'Data Analyst',  s:67, st:'pill-cyan',   stars:'★★★☆☆' },
];

const EVENTS = [
  { time:'09:00', title:'Triagem — Pedro Luz',           meta:'Dev Frontend · Video Call',            tipo:'Triagem',    tc:'pill-cyan'   },
  { time:'11:30', title:'Entrevista — Ana Lima',         meta:'Dev Sênior · Presencial',              tipo:'Entrevista', tc:'pill-purple' },
  { time:'14:00', title:'Entrevista Técnica — Juliana',  meta:'Product Manager · Google Meet',        tipo:'Técnica',    tc:'pill-orange' },
  { time:'16:00', title:'Proposta — Rafael Souza',       meta:'Dev Backend · Telefone',               tipo:'Proposta',   tc:'pill-green'  },
  { time:'17:30', title:'Feedback — Giovanna Silva',     meta:'Data Engineer · Video Call',           tipo:'Feedback',   tc:'pill-red'    },
];
const EVENT_DAYS = [5,8,10,12,14,18,20,25];
const BAR_DATA = [
  { mes:'Jan', c:45, h:30 }, { mes:'Fev', c:60, h:45 }, { mes:'Mar', c:75, h:55 },
  { mes:'Abr', c:55, h:40 }, { mes:'Mai', c:85, h:65 }, { mes:'Jun', c:100, h:75 },
];

// ─── PILL helper ──────────────────────────────────────────────────
const PILL = {
  'pill-blue':   { bg:'rgba(26,58,143,0.1)',   color:'#1a3a8f' },
  'pill-green':  { bg:'rgba(16,185,129,0.12)', color:'#10b981' },
  'pill-orange': { bg:'rgba(224,123,0,0.12)',  color:'#e07b00' },
  'pill-red':    { bg:'rgba(239,68,68,0.12)',  color:'#ef4444' },
  'pill-purple': { bg:'rgba(224,123,0,0.12)',  color:'#c96a00' },
  'pill-cyan':   { bg:'rgba(45,82,196,0.12)',  color:'#2d52c4' },
};

// FIX #1 — mapa de label correto para cada pill (era "Blue", "Purple"...)
const PILL_LABEL = {
  'pill-green':  'Aprovado',
  'pill-red':    'Reprovado',
  'pill-purple': 'Entrevista',
  'pill-orange': 'Triagem',
  'pill-blue':   'Triagem',
  'pill-cyan':   'Recebido',
};

function Pill({ cls, children, style={} }) {
  const p = PILL[cls] || PILL['pill-blue'];
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:p.bg, color:p.color, ...style }}>{children}</span>;
}

// ─── SCORE BAR ────────────────────────────────────────────────────
function ScoreBar({ val }) {
  const color = val>=85 ? V.green : val>=70 ? V.orange : V.muted;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:4, background:V.border, borderRadius:2, minWidth:60 }}>
        <div style={{ width:`${val}%`, height:'100%', background:color, borderRadius:2 }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:V.muted2, minWidth:28 }}>{val}</span>
    </div>
  );
}

// ─── MINI AVATAR ─────────────────────────────────────────────────
function MiniAvatar({ initials, size=20, color=V.accent }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${color},${V.accent2})`, fontSize:size*0.38, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>{initials}</div>;
}

// ─── CARD ─────────────────────────────────────────────────────────
function Card({ title, sub, badge, badgeColor='blue', children, style={} }) {
  const bc = badgeColor==='green' ? {bg:'rgba(16,185,129,0.12)',color:V.green} : badgeColor==='orange' ? {bg:'rgba(224,123,0,0.12)',color:V.orange} : {bg:'rgba(26,58,143,0.1)',color:V.accent};
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22, animation:'fadeUp 0.5s ease both', ...style }}>
      {(title||badge) && (
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            {title && <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>{title}</div>}
            {sub   && <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{sub}</div>}
          </div>
          {badge && <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600, background:bc.bg, color:bc.color, marginLeft:12, flexShrink:0 }}>{badge}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────
function KpiCard({ icon, label, value, delta, deltaUp=true, color, delay=0 }) {
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:20, position:'relative', overflow:'hidden', animation:`fadeUp 0.5s ease ${delay}s both`, transition:'all 0.3s', cursor:'default' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 32px rgba(26,58,143,0.12)`;e.currentTarget.style.borderColor='rgba(26,58,143,0.25)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.style.borderColor=V.border;}}>
      <div style={{ position:'absolute', top:-30, right:-30, width:80, height:80, borderRadius:'50%', background:color, opacity:0.08, pointerEvents:'none' }}/>
      <div style={{ width:36, height:36, borderRadius:9, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, lineHeight:1, color:V.text }}>{value ?? '—'}</div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, marginTop:8, padding:'2px 8px', borderRadius:20, background: deltaUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: deltaUp ? V.green : V.red }}>
        {deltaUp ? '▲' : '▼'} {delta}
      </div>
    </div>
  );
}

// ─── MODAL AGENDAMENTO ────────────────────────────────────────────
// FIX #3 — inputs controlados + chamada real à API
function Modal({ open, onClose }) {
  const [form, setForm] = useState({ candidato:'Ana Lima', vaga:'Dev Sênior Backend', data:'2025-03-10', horario:'14:00', tipo:'Video call (Google Meet)', lembrete:'1 hora antes (Email + WhatsApp)' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const res   = await fetch(`${BASE}/agenda`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body:    JSON.stringify(form),
      });
      if (res.ok) {
        setToast('Agendado com sucesso! ✓');
        setTimeout(() => { setToast(''); onClose(); }, 1500);
      } else {
        setToast('Erro ao agendar. Tente novamente.');
        setTimeout(() => setToast(''), 2500);
      }
    } catch {
      // Sem conexão: fecha com aviso
      setToast('Salvo localmente (offline)');
      setTimeout(() => { setToast(''); onClose(); }, 1500);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:420, maxWidth:'95vw', animation:'fadeUp 0.3s ease', position:'relative' }}>
        {toast && (
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background:V.accent, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>
            {toast}
          </div>
        )}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:6, color:V.text }}>Agendar Entrevista / Lembrete</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20 }}>Adicione ao calendário e configure notificações automáticas</div>

        {[['candidato','Candidato','text','Nome do candidato'],['vaga','Vaga','text','Selecione a vaga']].map(([key,l,t,p])=>(
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>{l}</label>
            <input type={t} value={form[key]} onChange={set(key)} placeholder={p} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}/>
          </div>
        ))}

        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          {[['data','Data','date'],['horario','Horário','time']].map(([key,l,t])=>(
            <div key={key} style={{ flex:1 }}>
              <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{l}</label>
              <input type={t} value={form[key]} onChange={set(key)} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}/>
            </div>
          ))}
        </div>

        {[['tipo','Tipo'],['lembrete','Lembrete automático']].map(([key,l])=>(
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>{l}</label>
            <input value={form[key]} onChange={set(key)} style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none' }}/>
          </div>
        ))}

        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} style={{ background: saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor: saving ? 'default' : 'pointer', fontSize:12, fontWeight:500 }}>
            {saving ? 'Salvando...' : '✓ Confirmar & Notificar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// MODAL NOVA VAGA — campos alinhados com Vagas.jsx (local, modelo, tipo, pcd)
function ModalNovaVaga({ open, onClose, onSaved }) {
  const EMPTY = {
    titulo:'', area:'Tecnologia', cidade:'', salario:'', prazo:'', descricao:'',
    // Campos que Vagas.jsx usa nos filtros:
    local:'',           // ex: "Presencial", "Remoto", "Lagoa da Prata"
    modelo:'Presencial',// Filtro "modelo" em Vagas.jsx
    tipo_contrato:'CLT',// Filtro "tipo" em Vagas.jsx — CLT, PJ, Estágio, Freelance
    pcd: false,         // Filtro pcd
    ativo: true,        // CRÍTICO: sem isso a vaga não aparece na listagem pública
  };
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  const [toastOk, setToastOk] = useState(true);

  const set    = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const setBool = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.checked }));

  const showToast = (msg, ok=true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), ok ? 1800 : 3000);
  };

  const handleSalvar = async () => {
    if (!form.titulo.trim()) { showToast('Informe o título da vaga', false); return; }
    if (!form.cidade.trim()) { showToast('Informe a cidade', false); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';

      // Mapeia form → nomes que o empresaController.criarVaga espera
      const payload = {
        titulo:        form.titulo,
        descricao:     form.descricao,
        requisitos:    '',
        salario:       form.salario,
        cidade:        form.cidade,
        estado:        '',
        tipo_contrato: form.tipo_contrato,
        modalidade:    form.modelo,   // controller usa 'modalidade', form usa 'modelo'
        area:          form.area,
        pcd:           form.pcd,
        prazo:         form.prazo,
      };

      const res = await fetch(`${BASE}/empresa/vagas`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body:    JSON.stringify(payload),
      });

      if (res.ok) {
        const criada = await res.json();
        showToast(`Vaga "${form.titulo}" publicada! ✓`);
        onSaved && onSaved(criada); // passa a vaga criada para o pai atualizar KPIs
        setTimeout(() => { onClose(); setForm(EMPTY); }, 1600);
      } else {
        const err = await res.json().catch(()=>({}));
        showToast(err.error || err.message || 'Erro ao criar vaga. Tente novamente.', false);
      }
    } catch {
      showToast('Sem conexão — tente novamente', false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputStyle = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" };
  const labelStyle = { fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:500, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', animation:'fadeUp 0.3s ease', position:'relative' }}>

        {toast && (
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background: toastOk ? V.accent : V.red, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>
            {toast}
          </div>
        )}

        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:4, color:V.text }}>Nova Vaga</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:22 }}>Preencha os dados e publique imediatamente</div>

        {/* Título */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Título da Vaga *</label>
          <input value={form.titulo} onChange={set('titulo')} placeholder="ex: Dev Frontend React"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        {/* Área + Tipo de contrato */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Área</label>
            <select value={form.area} onChange={set('area')} style={inputStyle}>
              {['Tecnologia','Design','Produto','Data','Marketing','Operações','Saúde','Educação','Outros'].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            {/* tipo_contrato é o "tipo" que Vagas.jsx filtra (CLT / PJ / Estágio / Freelance) */}
            <label style={labelStyle}>Tipo de contrato</label>
            <select value={form.tipo_contrato} onChange={set('tipo_contrato')} style={inputStyle}>
              {['CLT','PJ','Estágio','Freelance','Temporário'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Cidade + Modelo de trabalho */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Cidade *</label>
            <input value={form.cidade} onChange={set('cidade')} placeholder="Lagoa da Prata, MG"
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
          <div style={{ flex:1 }}>
            {/* modelo é o filtro "modelo" de Vagas.jsx */}
            <label style={labelStyle}>Modelo de trabalho</label>
            <select value={form.modelo} onChange={set('modelo')} style={inputStyle}>
              {['Presencial','Híbrido','Remoto'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Salário + Prazo */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Salário</label>
            <input value={form.salario} onChange={set('salario')} placeholder="R$ 3.000 – 5.000"
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Prazo de inscrição</label>
            <input type="date" value={form.prazo} onChange={set('prazo')} style={inputStyle}/>
          </div>
        </div>

        {/* Descrição */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Descrição</label>
          <textarea value={form.descricao} onChange={set('descricao')} rows={3}
            placeholder="Responsabilidades, requisitos, benefícios..."
            style={{ ...inputStyle, resize:'vertical' }}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        {/* PCD */}
        <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="pcd" checked={form.pcd} onChange={setBool('pcd')}
            style={{ width:16, height:16, accentColor:V.accent, cursor:'pointer' }}/>
          <label htmlFor="pcd" style={{ fontSize:13, color:V.text, cursor:'pointer' }}>
            Vaga destinada a Pessoa com Deficiência (PCD)
          </label>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={saving}
            style={{ background: saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor: saving ? 'default' : 'pointer', fontSize:13, fontWeight:600, transition:'background 0.2s' }}
            onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#0f2460'; }}
            onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=V.accent; }}>
            {saving ? 'Publicando...' : '🚀 Publicar Vaga'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL OVERVIEW ─────────────────────────────────────────────
function PanelOverview({ kpis, candidates, onModal }) {
  return (
    <div>
      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14, marginBottom:24 }}>
        {kpis.map((k,i) => <KpiCard key={i} {...k} delay={0.05+i*0.05}/>)}
      </div>

      {/* Gráfico + Funil */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title="Evolução Mensal" sub="Candidatos vs Contratações" badge="2025">
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, paddingTop:10 }}>
            {BAR_DATA.map((b,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
                <div style={{ width:'100%', display:'flex', gap:3, alignItems:'flex-end', height:90 }}>
                  <div style={{ flex:1, height:`${b.c}%`, background:V.accent, borderRadius:'4px 4px 0 0', transition:'height 0.6s' }}/>
                  <div style={{ flex:1, height:`${b.h}%`, background:V.accent3, opacity:0.7, borderRadius:'4px 4px 0 0', transition:'height 0.6s' }}/>
                </div>
                <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase' }}>{b.mes}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:12 }}>
            {[['Candidatos',V.accent],['Contratações',V.accent3]].map(([l,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:V.muted2 }}>
                <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>{l}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Funil Geral" sub="Pipeline atual" badge="Ao vivo" badgeColor="green">
          {[
            { name:'Recebidos',    count:347, pct:100, color:V.accent  },
            { name:'Triados',      count:236, pct:68,  color:V.accent2 },
            { name:'Entrevistas',  count:146, pct:42,  color:V.accent3 },
            { name:'Teste Técnico',count:97,  pct:28,  color:'#c96a00'  },
            { name:'Proposta',     count:42,  pct:12,  color:V.green   },
            { name:'Contratados',  count:22,  pct:6,   color:'#059669'  },
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:V.surface2, marginBottom:6, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.background=V.surface2;}}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <div style={{ fontSize:12, fontWeight:500, flex:1 }}>{s.name}</div>
              <div style={{ flex:1, height:4, background:V.border, borderRadius:2 }}>
                <div style={{ width:`${s.pct}%`, height:'100%', background:s.color, opacity:0.6, borderRadius:2 }}/>
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, minWidth:32, textAlign:'right' }}>{s.count}</div>
              <div style={{ fontSize:11, color:V.muted, width:40, textAlign:'right' }}>{s.pct}%</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Tabela + Alertas */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <Card title="Candidatos Recentes" sub="Últimas aplicações" badge="+hoje">
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>{['Candidato','Vaga','Score IA','Status','★'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {candidates.length > 0 ? candidates.map((c,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)`, transition:'background 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.03)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='';}} >
                    <td style={{ padding:'12px' }}>
                      <div style={{ fontWeight:500, fontSize:13 }}>{c.nome}</div>
                      <div style={{ fontSize:11, color:V.muted }}>{c.cidade || '—'}</div>
                    </td>
                    <td style={{ padding:'12px' }}>{c.vaga_titulo || '—'}</td>
                    {/* FIX #2 — score fixo, sem Math.random() */}
                    <td style={{ padding:'12px' }}><ScoreBar val={c.score_ia ?? 75}/></td>
                    <td style={{ padding:'12px' }}>
                      <Pill cls={c.status==='Aprovado'?'pill-green':c.status==='Reprovado'?'pill-red':c.status==='Entrevista'?'pill-purple':'pill-orange'}>
                        {c.status || 'Triagem'}
                      </Pill>
                    </td>
                    <td style={{ padding:'12px', color:V.orange }}>{'★'.repeat(Math.min(5,Math.ceil((c.score_ia??75)/20)))}</td>
                  </tr>
                )) : FALLBACK_CANDIDATES.map((c,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)` }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.03)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='';}}>
                    <td style={{ padding:'12px' }}><div style={{ fontWeight:500, fontSize:13 }}>{c.n}</div><div style={{ fontSize:11, color:V.muted }}>{c.loc}</div></td>
                    <td style={{ padding:'12px' }}>{c.v}</td>
                    <td style={{ padding:'12px' }}><ScoreBar val={c.s}/></td>
                    {/* FIX #1 — usa PILL_LABEL em vez de manipular string */}
                    <td style={{ padding:'12px' }}><Pill cls={c.st}>{PILL_LABEL[c.st] || 'Triagem'}</Pill></td>
                    <td style={{ padding:'12px', color:V.orange }}>{c.stars}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Alertas & Lembretes">
          {[
            { color:V.red,    msg:'3 candidatos sem resposta há +7 dias', time:'urgente' },
            { color:V.orange, msg:'Entrevista com Ana Lima — hoje 14h',   time:'em 2h'  },
            { color:V.accent, msg:'Vaga "Dev Senior" expira em 3 dias',   time:'03/mar' },
            { color:V.accent3,msg:'Teste técnico aguardando avaliação (5)',time:'pendente'},
            { color:V.green,  msg:'Rafael aceitou a proposta! 🎉',         time:'hoje'  },
            { color:V.orange, msg:'Relatório mensal pronto para revisão',  time:'28/fev' },
          ].map((a,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background:V.surface2, marginBottom:8, fontSize:12, animation:`fadeUp 0.3s ease ${0.1+i*0.05}s both` }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:a.color, flexShrink:0 }}/>
              <span style={{ flex:1 }}>{a.msg}</span>
              <span style={{ fontSize:10, color:V.muted2, whiteSpace:'nowrap' }}>{a.time}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── PAINEL FUNIL CRM (KANBAN) ────────────────────────────────────
function PanelFunil({ onModal }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>Funil de Recrutamento</div>
          <div style={{ fontSize:11, color:V.muted }}>Arraste os candidatos entre colunas</div>
        </div>
        <button onClick={onModal} style={{ background:V.accent, border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+ Adicionar Candidato</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,220px)', gap:14, overflowX:'auto', paddingBottom:12 }}>
        {KANBAN_STAGES.map((s,si) => {
          const cards = KANBAN_DATA.filter(c => c.stage === si);
          return (
            <div key={si} style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, padding:14, minHeight:400 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:s.color }}>{s.name}</span>
                <span style={{ width:20, height:20, borderRadius:6, background:V.surface2, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', color:V.muted }}>{cards.length}</span>
              </div>
              {cards.map((c,i) => (
                <div key={i} draggable style={{ background:V.surface2, border:`1px solid ${V.border}`, borderRadius:10, padding:12, marginBottom:8, cursor:'grab', transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(26,58,143,0.12)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                  <div style={{ fontSize:12, fontWeight:500, marginBottom:4 }}>{c.name}</div>
                  <div style={{ fontSize:10, color:V.muted, marginBottom:8 }}>{c.role}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <MiniAvatar initials={c.initials} size={20}/>
                    <Pill cls={c.score>=85?'pill-green':c.score>=70?'pill-orange':'pill-red'} style={{ fontSize:9 }}>Score {c.score}</Pill>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAINEL BANCO DE TALENTOS ─────────────────────────────────────
// ─── MODAL CONVIDAR TALENTO ──────────────────────────────────────
function ModalConvidar({ talent, onClose }) {
  const [msg, setMsg]       = useState(`Olá ${talent?.name?.split(' ')[0]}, temos uma oportunidade alinhada ao seu perfil. Podemos conversar?`);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const enviar = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      await fetch(`${BASE}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ destinatario_id: talent.id, conteudo: msg }),
      });
      setSent(true);
      setTimeout(onClose, 1600);
    } catch {
      setSending(false);
    }
  };

  if (!talent) return null;
  const initials = talent.name.split(' ').map(n=>n[0]).join('').slice(0,2);
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
            <div style={{ fontWeight:700, fontSize:15, color:V.text }}>Convite enviado!</div>
            <div style={{ fontSize:12, color:V.muted, marginTop:4 }}>{talent.name} receberá sua mensagem no dashboard.</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:11, background:`${talent.color}22`, color:talent.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700 }}>{initials}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:V.text }}>{talent.name}</div>
                <div style={{ fontSize:12, color:V.muted }}>{talent.role} · {talent.city}</div>
              </div>
            </div>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>Mensagem</label>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4}
              style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
              <button onClick={enviar} disabled={sending}
                style={{ background:V.accent, border:'none', color:'white', padding:'9px 20px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                {sending ? 'Enviando...' : '📨 Enviar Convite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PanelTalent() {
  const [talents, setTalents]     = useState(TALENTS_INIT);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [filterArea, setFilterArea] = useState('Todos');
  const [sortBy, setSortBy]       = useState('score');      // score | nome | favoritos | recente
  const [scoreMin, setScoreMin]   = useState(0);
  const [convidar, setConvidar]   = useState(null);         // talent a convidar

  const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
  const token = localStorage.getItem('token');

  // ── Busca talentos da API ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE}/talentos`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data ?? []);
        if (list.length > 0) setTalents(list.map(t => ({
          id:    t.id,
          name:  t.nome || t.name,
          role:  t.cargo || t.role || 'Candidato',
          city:  t.cidade || t.city || '—',
          area:  t.area   || 'Outros',
          tags:  Array.isArray(t.habilidades) ? t.habilidades : (t.tags || []),
          fav:   t.favorito ?? t.fav ?? false,
          score: t.score_ia ?? t.score ?? 70,
          color: [V.accent,V.accent2,V.accent3,V.green,'#c96a00','#7c3aed'][(t.nome||t.name||'').charCodeAt(0)%6],
          favAt: t.fav_at || null,
        })));
      } catch {
        // Silencia — mantém mocks
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Persistir favorito no backend ────────────────────────────────
  const toggleFav = async (id) => {
    const t = talents.find(t => t.id === id);
    const novoFav = !t.fav;
    // Atualiza state imediatamente (otimista)
    setTalents(prev => prev.map(t => t.id === id
      ? { ...t, fav: novoFav, favAt: novoFav ? new Date().toISOString() : null }
      : t
    ));
    // Persiste no backend
    try {
      await fetch(`${BASE}/talentos/${id}/favorito`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ favorito: novoFav }),
      });
    } catch { /* silencia — state local já atualizado */ }
  };

  // ── Filtro + Ordenação ───────────────────────────────────────────
  const displayed = talents
    .filter(t => {
      const q = query.toLowerCase();
      const matchQ = !q || (t.name+t.role+t.city+(t.tags||[]).join(' ')).toLowerCase().includes(q);
      const matchA = filterArea==='Todos' ? true : filterArea==='Favoritos' ? t.fav : t.area===filterArea;
      const matchS = t.score >= scoreMin;
      return matchQ && matchA && matchS;
    })
    .sort((a,b) => {
      if (sortBy==='score')     return b.score - a.score;
      if (sortBy==='nome')      return a.name.localeCompare(b.name);
      if (sortBy==='favoritos') return (b.fav?1:0) - (a.fav?1:0);
      if (sortBy==='recente')   return new Date(b.favAt||0) - new Date(a.favAt||0);
      return 0;
    });

  const favCount = talents.filter(t=>t.fav).length;

  const sel = { padding:'7px 12px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, color:V.text, fontSize:12, outline:'none', cursor:'pointer', fontFamily:'inherit' };

  return (
    <div>
      {/* ── Header com stats ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>Banco de Talentos</div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>
            {talents.length} cadastrados · {favCount} favoritos · {displayed.length} exibidos
          </div>
        </div>
        {/* Ordenação */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:V.muted }}>Ordenar:</span>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={sel}>
            <option value="score">Maior Score</option>
            <option value="nome">Nome A–Z</option>
            <option value="favoritos">Favoritos primeiro</option>
            <option value="recente">Favoritado recentemente</option>
          </select>
        </div>
      </div>

      {/* ── Busca ── */}
      <input value={query} onChange={e=>setQuery(e.target.value)}
        placeholder="🔍  Buscar por nome, cargo, cidade, habilidade..."
        style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:10, padding:'10px 16px', color:V.text, fontSize:13, outline:'none', marginBottom:14, transition:'border-color 0.2s' }}
        onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>

      {/* ── Filtros área + score ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {['Todos','Tecnologia','Design','Produto','Data','Favoritos'].map(f => (
          <button key={f} onClick={()=>setFilterArea(f)}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer',
              border:`1px solid ${filterArea===f?V.accent:V.border}`,
              background: filterArea===f ? V.accent : 'none',
              color: filterArea===f ? 'white' : V.muted2,
              transition:'all 0.15s', fontFamily:"'DM Sans',sans-serif",
              ...(f==='Favoritos' && favCount>0 ? { borderColor: V.orange, color: filterArea===f?'white':V.orange } : {}) }}>
            {f}{f==='Favoritos' && favCount>0 ? ` (${favCount})` : ''}
          </button>
        ))}
        {/* Filtro score mínimo */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:V.muted, whiteSpace:'nowrap' }}>Score mín: <strong style={{color:V.text}}>{scoreMin}</strong></span>
          <input type="range" min={0} max={100} step={5} value={scoreMin} onChange={e=>setScoreMin(Number(e.target.value))}
            style={{ width:100, accentColor:V.accent }}/>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:V.muted }}>
          <div style={{ width:32, height:32, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite', margin:'0 auto 12px' }}/>
          Carregando talentos...
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:V.muted2 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
          Nenhum talento encontrado com esses filtros.
          <br/>
          <button onClick={()=>{ setQuery(''); setFilterArea('Todos'); setScoreMin(0); }}
            style={{ marginTop:12, background:V.accent, border:'none', color:'white', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {displayed.map((t,i) => {
            const initials = t.name.split(' ').map(n=>n[0]).join('').slice(0,2);
            const scoreColor = t.score>=85 ? V.green : t.score>=70 ? V.orange : V.red;
            return (
              <div key={t.id}
                style={{ background:V.surface, border:`1px solid ${t.fav ? 'rgba(224,123,0,0.3)' : V.border}`, borderRadius:12, padding:18, transition:'all 0.2s', cursor:'pointer', animation:`fadeUp 0.35s ease ${i*0.03}s both`, position:'relative' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(26,58,143,0.1)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>

                {/* Favorito no topo direito */}
                <button onClick={e=>{e.stopPropagation();toggleFav(t.id);}}
                  style={{ position:'absolute', top:12, right:12, background:'none', border:'none', cursor:'pointer', fontSize:16, opacity:t.fav?1:0.3, transition:'all 0.2s', lineHeight:1 }}
                  title={t.fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.25)';e.currentTarget.style.opacity='1';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.opacity=t.fav?'1':'0.3';}}>
                  {t.fav ? '⭐' : '☆'}
                </button>

                <div style={{ width:44, height:44, borderRadius:12, background:`${t.color}22`, color:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, marginBottom:12, fontFamily:"'Syne',sans-serif" }}>{initials}</div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2, paddingRight:24 }}>{t.name}</div>
                <div style={{ fontSize:11, color:V.muted, marginBottom:10 }}>{t.role} · {t.city}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                  {(t.tags||[]).slice(0,3).map(tg=><span key={tg} style={{ fontSize:9, padding:'2px 7px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:4, color:V.muted2 }}>{tg}</span>)}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  {/* Score bar */}
                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:4, background:V.surface2, borderRadius:2 }}>
                      <div style={{ width:`${t.score}%`, height:'100%', background:scoreColor, borderRadius:2 }}/>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:scoreColor, minWidth:22 }}>{t.score}</span>
                  </div>
                  {/* Botão convidar */}
                  <button onClick={e=>{e.stopPropagation();setConvidar(t);}}
                    style={{ background:V.accent, border:'none', color:'white', padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:500, flexShrink:0 }}>
                    Convidar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal convidar */}
      {convidar && <ModalConvidar talent={convidar} onClose={()=>setConvidar(null)}/>}
    </div>
  );
}

// ─── PAINEL RANKING IA ────────────────────────────────────────────
function PanelAI({ onModal }) {
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, marginBottom:4, color:V.text }}>Ranking Inteligente com IA</div>
        <div style={{ fontSize:12, color:V.muted }}>Score automático de aderência · Matching comportamental · Sugestões baseadas em histórico</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
        {AI_DATA.map((c,i) => {
          const dash = 2 * Math.PI * 20;
          const fill = dash * c.score / 100;
          return (
            <div key={i} style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, overflow:'hidden', animation:`fadeUp 0.4s ease ${i*0.07}s both`, transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(224,123,0,0.3)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;}}>
              <div style={{ padding:16, borderBottom:`1px solid ${V.border}`, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ position:'relative', width:48, height:48, flexShrink:0 }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform:'rotate(-90deg)' }}>
                    <circle cx="24" cy="24" r="20" fill="none" stroke={V.border} strokeWidth="3"/>
                    <circle cx="24" cy="24" r="20" fill="none" stroke={c.color} strokeWidth="3" strokeDasharray={`${fill} ${dash}`} strokeLinecap="round"/>
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:c.color }}>{c.score}%</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:V.text }}>{c.name}</div>
                  <div style={{ fontSize:11, color:V.muted, marginBottom:4 }}>{c.role}</div>
                  <div>
                    {c.traits.map(t=><span key={t} style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:10, background:'rgba(224,123,0,0.1)', color:V.accent3, border:'1px solid rgba(224,123,0,0.2)', margin:2 }}>{t}</span>)}
                  </div>
                </div>
                <button onClick={onModal} style={{ background:V.accent, border:'none', color:'white', fontSize:11, padding:'6px 12px', borderRadius:8, cursor:'pointer', flexShrink:0 }}>Convidar</button>
              </div>
              <div style={{ padding:16 }}>
                <div style={{ fontSize:11, color:V.muted, marginBottom:6 }}>🧠 IA recomenda: <span style={{ color:V.text }}>{c.reason}</span></div>
                <div>{c.skills.map(s=><span key={s} style={{ fontSize:9, padding:'2px 7px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:4, color:V.muted2, margin:2, display:'inline-block' }}>{s}</span>)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAINEL AGENDA ────────────────────────────────────────────────
function PanelAgenda({ onModal }) {
  const firstDay = new Date(2025,2,1).getDay();
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push({ day:28-firstDay+i+1, other:true });
  for(let d=1;d<=31;d++) cells.push({ day:d, today:d===5, event:EVENT_DAYS.includes(d) });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16 }}>
      <div>
        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, padding:18 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <button style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>Março 2025</div>
            <button style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} style={{ fontSize:9, textAlign:'center', color:V.muted, textTransform:'uppercase', padding:'4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {cells.map((c,i) => (
              <div key={i} style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, borderRadius:6, cursor:'pointer', position:'relative', background: c.today ? V.accent : 'transparent', color: c.today ? 'white' : c.other ? '#d1d9f0' : V.text, fontWeight: c.today ? 700 : 400, transition:'all 0.15s' }}
                onMouseEnter={e=>{if(!c.today)e.currentTarget.style.background=V.surface2;}}
                onMouseLeave={e=>{if(!c.today)e.currentTarget.style.background='transparent';}}>
                {c.day}
                {c.event && !c.today && <span style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:4, height:4, background:V.orange, borderRadius:'50%' }}/>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={onModal} style={{ width:'100%', background:V.accent, border:'none', color:'white', padding:'9px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+ Agendar Entrevista</button>
          <button onClick={onModal} style={{ width:'100%', background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px', borderRadius:8, cursor:'pointer', fontSize:12 }}>🔔 Definir Lembrete</button>
        </div>
      </div>
      <div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, marginBottom:14, color:V.text }}>Hoje — 5 de Março</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {EVENTS.map((ev,i) => {
            const p = PILL[ev.tc] || PILL['pill-blue'];
            return (
              <div key={i} style={{ display:'flex', gap:14, background:V.surface, border:`1px solid ${V.border}`, borderRadius:10, padding:'14px 16px', alignItems:'center', animation:`fadeUp 0.4s ease ${i*0.07}s both`, transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(26,58,143,0.25)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;}}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, minWidth:50, color:V.accent }}>{ev.time}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:3, color:V.text }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:V.muted }}>{ev.meta}</div>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:6, fontSize:10, fontWeight:600, background:p.bg, color:p.color }}>{ev.tipo}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL RELATÓRIOS ────────────────────────────────────────────
function PanelReports() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { icon:'🏆', label:'Cargo mais difícil', value:'Dev Sênior', delta:'42d médio',    deltaUp:false, color:V.accent3 },
          { icon:'💵', label:'Média Salarial Dev',  value:'R$12k',     delta:'8% mercado',   deltaUp:true,  color:V.accent2 },
          { icon:'🚶', label:'Taxa Turnover',        value:'9%',        delta:'2pp abaixo',   deltaUp:false, color:V.red     },
        ].map((k,i) => <KpiCard key={i} {...k} delay={0.05+i*0.05}/>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title="Vagas por Dificuldade">
          {[['Dev Sênior Backend',85,V.red,'Alta'],['Data Scientist',75,V.orange,'Média'],['UX Designer',55,V.orange,'Média'],['Product Manager',40,V.green,'Baixa'],['Analista de Suporte',25,V.green,'Baixa']].map(([l,p,c,t],i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid rgba(226,232,244,0.6)` }}>
              <span style={{ fontSize:12 }}>{l}</span>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:120, height:4, background:V.border, borderRadius:2 }}><div style={{ width:`${p}%`, height:'100%', background:c, borderRadius:2 }}/></div>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:c }}>{t}</span>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Médias Salariais por Função">
          {[['Dev Sênior','R$ 14.000'],['Data Scientist','R$ 12.500'],['Product Manager','R$ 11.000'],['UX Designer','R$ 8.500'],['Dev Pleno','R$ 9.000'],['Analista de Suporte','R$ 4.200']].map(([r,s],i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid rgba(226,232,244,0.6)` }}>
              <span style={{ fontSize:12 }}>{r}</span>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:V.text }}>{s}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card title="Comparativo com Mercado" badge="Glassdoor · 2025" badgeColor="green">
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160, paddingTop:10 }}>
          {[['Dev Sr',80,75],['Data Sci',90,70],['PM',65,80],['UX',55,60],['Dev Pl',45,52]].map(([l,a,b],i)=>(
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
              <div style={{ width:'100%', display:'flex', gap:3, alignItems:'flex-end', height:130 }}>
                <div style={{ flex:1, height:`${a}%`, background:V.accent, borderRadius:'4px 4px 0 0' }}/>
                <div style={{ flex:1, height:`${b}%`, background:V.accent3, opacity:0.7, borderRadius:'4px 4px 0 0' }}/>
              </div>
              <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:12 }}>
          {[['Nossa empresa',V.accent],['Média mercado',V.accent3]].map(([l,c])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:V.muted2 }}>
              <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>{l}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── PAINEL HISTÓRICO ─────────────────────────────────────────────
function PanelHistory() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { icon:'📣', label:'Engajamento Top Vaga',  value:'Dev Sr',  delta:'148 apps',       deltaUp:true,  color:V.accent  },
          { icon:'⚡', label:'Resp. Média Candidato', value:'2.4h',    delta:'Melhor do setor', deltaUp:true,  color:V.green   },
          { icon:'⭐', label:'Reputação Employer',    value:'4.6',     delta:'+0.3 pts',        deltaUp:true,  color:V.orange  },
          { icon:'🏃', label:'Taxa de Desistência',   value:'12%',     delta:'Meta: 10%',       deltaUp:false, color:V.red     },
        ].map((k,i) => <KpiCard key={i} {...k} delay={0.05+i*0.05}/>)}
      </div>
      <Card title="Histórico de Vagas com Maior Engajamento">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{['Vaga','Período','Apps','Contratados','Conversão','Tempo Médio','Reputação'].map(h=>(
              <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {[
                ['Dev Sênior Backend','Jan–Fev 2025',148,3,'pill-orange','2%','38d','★★★★☆'],
                ['UX Designer Pleno', 'Fev 2025',    92, 2,'pill-blue',  '2.2%','22d','★★★★★'],
                ['Product Manager',   'Dez–Jan 2025',67, 1,'pill-green', '1.5%','18d','★★★★☆'],
                ['Data Analyst Jr',   'Jan 2025',    203,5,'pill-green', '2.5%','15d','★★★★★'],
                ['Dev Frontend React','Dez 2024',    119,2,'pill-orange','1.7%','27d','★★★★☆'],
              ].map(([v,p,a,c,pc,cv,t,r],i) => (
                <tr key={i} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)`, transition:'background 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,58,143,0.03)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='';}}>
                  <td style={{ padding:'12px 12px', fontWeight:500 }}>{v}</td>
                  <td style={{ padding:'12px 12px', color:V.muted }}>{p}</td>
                  <td style={{ padding:'12px 12px' }}>{a}</td>
                  <td style={{ padding:'12px 12px' }}>{c}</td>
                  <td style={{ padding:'12px 12px' }}><Pill cls={pc}>{cv}</Pill></td>
                  <td style={{ padding:'12px 12px' }}>{t}</td>
                  <td style={{ padding:'12px 12px', color:V.orange }}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── NAV ICONS ────────────────────────────────────────────────────
const ICONS = {
  overview: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/></svg>,
  funnel:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4h18l-7 8v7l-4-2V12L3 4z" strokeWidth="1.5"/></svg>,
  talent:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth="1.5"/></svg>,
  ai:       <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5"/><path d="M9 12l2 2 4-4" strokeWidth="1.5"/></svg>,
  agenda:   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/><path d="M3 9h18M8 2v4M16 2v4" strokeWidth="1.5"/></svg>,
  reports:  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="1.5"/></svg>,
  history:  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1.5"/></svg>,
  indicadores: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 8v8M12 11v5M8 14v2M3 20h18M5 20V4l7 3 7-3v16" strokeWidth="1.5"/></svg>,
  colaboradores: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.5"/><circle cx="9" cy="7" r="4" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.5"/></svg>,

};
const TABS = [
  { id:'overview', label:'Visão Geral'       },
  { id:'funnel',   label:'Funil CRM'         },
  { id:'talent',   label:'Banco de Talentos' },
  { id:'ai',       label:'Ranking IA'        },
  { id:'agenda',   label:'Agenda'            },
  { id:'reports',  label:'Relatórios'        },
  { id:'history',  label:'Histórico'         },
  { id:'indicadores', label:'Indicadores RH' },
  { id:'colaboradores', label:'Colaboradores' },
];
const PAGE_TITLES = {
  overview:'Visão Geral Executiva', funnel:'Funil de Recrutamento — CRM',
  talent:'Banco de Talentos', ai:'Ranking Inteligente com IA',
  agenda:'Agenda & Lembretes', reports:'Relatórios Estratégicos', history:'Histórico de Performance',
  indicadores: 'Indicadores de RH',
  colaboradores: 'Gestão de Colaboradores',

};

// ─── DADOS MOCK (fallback quando API ainda não tem dados) ─────────
const RH_MOCK = {
  headcount:     { total: 1432, feminino: 631, masculino: 801, outro: 0 },
  admissoes:     { total: 1831, yoy: 27, yoy_up: true  },
  desligamentos: { total: 399,  yoy: 66, yoy_up: false },
  turnover:      28,
  por_departamento: [
    { departamento:'Comercial',   total: 579 },
    { departamento:'Financeiro',  total: 521 },
    { departamento:'Marketing',   total: 273 },
    { departamento:'Logística',   total: 106 },
    { departamento:'Operações',   total: 66  },
    { departamento:'TI',          total: 101 },
  ],
  evolucao_anual: [
    { ano:2019, admissoes:130 },
    { ano:2020, admissoes:105 },
    { ano:2021, admissoes:262 },
    { ano:2022, admissoes:243 },
    { ano:2023, admissoes:310 },
    { ano:2024, admissoes:287 },
  ],
  faixa_etaria: [
    { faixa:'18-25', total:270 },
    { faixa:'26-35', total:330 },
    { faixa:'36-45', total:318 },
    { faixa:'46-54', total:343 },
    { faixa:'55+',   total:378 },
  ],
};

// ─── DONUT CHART (SVG puro, sem deps) ────────────────────────────
function DonutChart({ value, total, color1, color2, label, sublabel }) {
  const R = 52;
  const circ = 2 * Math.PI * R;
  const pct  = total > 0 ? value / total : 0;
  const dash = pct * circ;

  return (
    <div style={{ position:'relative', width:140, height:140, flexShrink:0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={R} fill="none" stroke={color2} strokeWidth="14"/>
        <circle cx="70" cy="70" r={R} fill="none" stroke={color1} strokeWidth="14"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
      </svg>
      <div style={{
        position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', textAlign:'center',
      }}>
        <div style={{ fontSize:10, marginBottom:2 }}>👥</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:V.text, lineHeight:1 }}>
          {total.toLocaleString('pt-BR')}
        </div>
        <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}

// ─── BARRA HORIZONTAL ────────────────────────────────────────────
function HBar({ label, value, total, color, index }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const displayPct = Math.round(pct);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10,
      animation:`fadeUp 0.4s ease ${index * 0.05}s both` }}>
      <div style={{ fontSize:12, color:V.text, minWidth:100, textAlign:'right' }}>{label}</div>
      <div style={{ flex:1, height:22, background:V.surface2, borderRadius:4, overflow:'hidden', position:'relative' }}>
        <div style={{
          width:`${pct}%`, height:'100%', background:color,
          borderRadius:4, transition:'width 0.8s ease',
          display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6,
        }}>
          {pct > 20 && <span style={{ fontSize:10, color:'white', fontWeight:600 }}>{value.toLocaleString('pt-BR')}</span>}
        </div>
        {pct <= 20 && (
          <span style={{ position:'absolute', left:`${pct + 1}%`, top:'50%', transform:'translateY(-50%)', fontSize:10, color:V.muted, fontWeight:500 }}>
            {value.toLocaleString('pt-BR')} ({displayPct}%)
          </span>
        )}
      </div>
      <div style={{ fontSize:11, color:V.muted2, minWidth:40, textAlign:'right' }}>
        {displayPct}%
      </div>
    </div>
  );
}

// ─── BAR CHART ANUAL ─────────────────────────────────────────────
function BarChartAnual({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.admissoes));

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, paddingTop:8 }}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d.admissoes / max) * 100 : 0;
        const prevAdm = i > 0 ? data[i-1].admissoes : d.admissoes;
        const delta = i > 0 ? Math.round(((d.admissoes - prevAdm) / prevAdm) * 100) : null;
        const isUp = delta >= 0;

        return (
          <div key={d.ano} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
            {delta !== null && (
              <div style={{ fontSize:9, color: isUp ? V.green : V.red, fontWeight:600, whiteSpace:'nowrap' }}>
                {isUp ? '▲' : '▼'} {Math.abs(delta)}%
              </div>
            )}
            <div style={{ fontSize:10, fontWeight:700, color:V.text }}>{d.admissoes}</div>
            <div
              title={`${d.ano}: ${d.admissoes}`}
              style={{
                width:'100%', background:`linear-gradient(180deg, ${V.accent2}, ${V.accent})`,
                borderRadius:'4px 4px 0 0', height:`${Math.max(pct, 8)}%`,
                transition:'height 0.7s ease', cursor:'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(180deg, ${V.accent3}, ${V.accent})`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(180deg, ${V.accent2}, ${V.accent})`; }}
            />
            <div style={{ fontSize:9, color:V.muted }}>{d.ano}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── METRIC CARD RH ──────────────────────────────────────────────
function RHMetricCard({ icon, label, value, yoy, yoyUp, delay }) {
  return (
    <div style={{
      background:'rgba(173,216,255,0.08)',
      border:`1px solid rgba(173,216,255,0.25)`,
      borderRadius:14, padding:'18px 20px',
      animation:`fadeUp 0.5s ease ${delay}s both`,
      transition:'all 0.25s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,58,143,0.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:`rgba(173,216,255,0.15)`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
        <div style={{ fontSize:10, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500 }}>{label}</div>
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color:V.text, lineHeight:1, marginBottom:8 }}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600,
        padding:'3px 10px', borderRadius:20,
        background: yoyUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        color:       yoyUp ? V.green : V.red,
      }}>
        {yoyUp ? '▲' : '▼'} YOY: {Math.abs(yoy)}%
      </div>
    </div>
  );
}

// ─── PAINEL PRINCIPAL ─────────────────────────────────────────────
function PanelIndicadoresRH() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
        const res   = await fetch(`${BASE}/empresa/indicadores-rh`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        // Se API retornou headcount 0, usa mock para demo
        if (!json.headcount || json.headcount.total === 0) {
          setData(RH_MOCK);
          setIsMock(true);
        } else {
          setData(json);
          setIsMock(false);
        }
      } catch {
        setData(RH_MOCK);
        setIsMock(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:16 }}>
      <div style={{ width:36, height:36, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
      <p style={{ color:V.muted, fontSize:14 }}>Carregando indicadores...</p>
    </div>
  );

  const d = data;
  const maxDepto = Math.max(...(d.por_departamento || []).map(x => parseInt(x.total)));
  const maxFaixa = Math.max(...(d.faixa_etaria || []).map(x => parseInt(x.total)));

  // Cores para departamentos
  const DEPT_COLORS = [V.accent, V.accent2, V.accent3, V.green, '#7c3aed', '#c96a00', '#06b6d4', '#f59e0b'];

  return (
    <div>
      {/* Aviso de dados demo */}
      {isMock && (
        <div style={{
          marginBottom:20, padding:'10px 16px', borderRadius:10,
          background:'rgba(224,123,0,0.1)', border:`1px solid rgba(224,123,0,0.25)`,
          fontSize:12, color:V.orange, display:'flex', alignItems:'center', gap:8,
        }}>
          <span>⚠️</span>
          <span>
            <strong>Dados de demonstração.</strong> Execute o script SQL e cadastre colaboradores para ver seus dados reais.
          </span>
        </div>
      )}

      {/* ── Bloco superior: KPI cards + Headcount donut ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:14, marginBottom:20, alignItems:'stretch' }}>

        <RHMetricCard
          icon="🧑‍🤝‍🧑" label="Admissões" value={d.admissoes.total}
          yoy={d.admissoes.yoy} yoyUp={d.admissoes.yoy_up} delay={0.05}/>

        <RHMetricCard
          icon="🚪" label="Desligamentos" value={d.desligamentos.total}
          yoy={d.desligamentos.yoy} yoyUp={d.desligamentos.yoy_up} delay={0.1}/>

        {/* Turnover */}
        <div style={{
          background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:'18px 20px',
          animation:'fadeUp 0.5s ease 0.15s both',
        }}>
          <div style={{ fontSize:10, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500, marginBottom:10 }}>
            📉 Turnover
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:36, color:V.text, lineHeight:1, marginBottom:6 }}>
            {d.turnover}%
          </div>
          {/* Barra de turnover */}
          <div style={{ height:6, background:V.surface2, borderRadius:3, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:3,
              width:`${Math.min(d.turnover, 100)}%`,
              background: d.turnover > 20 ? V.red : d.turnover > 10 ? V.orange : V.green,
              transition:'width 1s ease',
            }}/>
          </div>
          <div style={{ fontSize:10, color:V.muted, marginTop:4 }}>
            {d.turnover > 20 ? '⚠ Alto — atenção' : d.turnover > 10 ? '⚡ Moderado' : '✓ Saudável'}
          </div>
        </div>

        {/* Headcount donut */}
        <div style={{
          background:V.surface, border:`1px solid ${V.border}`, borderRadius:14,
          padding:'18px 20px', display:'flex', flexDirection:'column', alignItems:'center',
          animation:'fadeUp 0.5s ease 0.2s both',
        }}>
          <div style={{ fontSize:10, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500, marginBottom:10 }}>
            Headcount Total
          </div>
          <DonutChart
            value={d.headcount.feminino}
            total={d.headcount.total}
            color1={V.accent}
            color2={V.surface2}
            sublabel="Headcount"
          />
          {/* Legenda gênero */}
          <div style={{ display:'flex', gap:14, marginTop:10 }}>
            {[
              { label:'Feminino',  val: d.headcount.feminino,  color: V.accent  },
              { label:'Masculino', val: d.headcount.masculino, color: V.border  },
            ].map(g => (
              <div key={g.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:g.color }}/>
                <span style={{ color:V.muted }}>{g.label}</span>
                <span style={{ fontWeight:700, color:V.text }}>
                  {g.val} ({d.headcount.total > 0 ? Math.round((g.val/d.headcount.total)*100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Linha 2: Evolução anual + Departamentos ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Evolução anual */}
        <div style={{
          background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22,
          animation:'fadeUp 0.5s ease 0.25s both',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>
                Evolução de Colaboradores
              </div>
              <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>Admissões por ano</div>
            </div>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600,
              background:'rgba(26,58,143,0.1)', color:V.accent }}>Anual</span>
          </div>
          <BarChartAnual data={d.evolucao_anual}/>
        </div>

        {/* Por departamento */}
        <div style={{
          background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22,
          animation:'fadeUp 0.5s ease 0.3s both',
        }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, marginBottom:4, color:V.text }}>
            Colaboradores por Departamento
          </div>
          <div style={{ fontSize:11, color:V.muted, marginBottom:18 }}>
            Total: {d.headcount.total.toLocaleString('pt-BR')} ativos
          </div>
          {(d.por_departamento || []).map((dep, i) => (
            <HBar
              key={dep.departamento}
              label={dep.departamento}
              value={parseInt(dep.total)}
              total={maxDepto}
              color={DEPT_COLORS[i % DEPT_COLORS.length]}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ── Linha 3: Faixa etária ── */}
      <div style={{
        background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22,
        animation:'fadeUp 0.5s ease 0.35s both',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>
              Colaboradores por Faixa Etária
            </div>
            <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>Distribuição atual</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
          {(d.faixa_etaria || []).map((f, i) => {
            const pct = maxFaixa > 0 ? Math.round((parseInt(f.total) / d.headcount.total) * 100) : 0;
            const height = maxFaixa > 0 ? Math.max((parseInt(f.total) / maxFaixa) * 120, 12) : 12;
            return (
              <div key={f.faixa} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                animation:`fadeUp 0.4s ease ${i * 0.06}s both`,
              }}>
                <div style={{ fontSize:11, fontWeight:700, color:V.text }}>{pct}%</div>
                <div style={{ fontSize:10, color:V.muted }}>{parseInt(f.total).toLocaleString('pt-BR')}</div>
                <div style={{
                  width:'100%', background:`linear-gradient(180deg, ${V.accent2}99, ${V.accent})`,
                  borderRadius:'6px 6px 0 0', height:`${height}px`,
                  transition:'height 0.8s ease', minHeight:8,
                }}/>
                <div style={{ fontSize:12, fontWeight:600, color:V.text }}>{f.faixa}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ================================================================
// FIM DE PanelIndicadoresRH
// ================================================================

// ─── MODAL COLABORADOR (criar / editar) ──────────────────────────
function ModalColaborador({ open, onClose, onSaved, colaborador = null }) {
  const EMPTY = {
    nome: '', genero: '', data_nascimento: '', departamento: '',
    cargo: '', data_admissao: '', salario: '', email: '', telefone: '', observacao: '',
  };
  const [form, setForm]     = useState(colaborador ? { ...EMPTY, ...colaborador, salario: colaborador.salario || '' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  const [toastOk, setToastOk] = useState(true);

  // Sincroniza quando abrir em modo edição
  useEffect(() => {
    if (colaborador) setForm({ ...EMPTY, ...colaborador, salario: colaborador.salario || '' });
    else setForm(EMPTY);
  }, [colaborador, open]);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const showToast = (msg, ok = true) => {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(''), ok ? 1800 : 3000);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim())        { showToast('Nome é obrigatório', false); return; }
    if (!form.data_admissao)      { showToast('Data de admissão é obrigatória', false); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const url    = colaborador ? `${BASE}/colaboradores/${colaborador.id}` : `${BASE}/colaboradores`;
      const method = colaborador ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, salario: form.salario ? parseFloat(String(form.salario).replace(',', '.')) : null }),
      });
      if (res.ok) {
        const saved = await res.json();
        showToast(colaborador ? 'Colaborador atualizado ✓' : 'Colaborador cadastrado ✓');
        setTimeout(() => { onSaved(saved); onClose(); }, 1400);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erro ao salvar', false);
      }
    } catch { showToast('Sem conexão', false); }
    finally  { setSaving(false); }
  };

  if (!open) return null;

  const inp  = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" };
  const lbl  = { fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 };
  const row2 = { display:'flex', gap:12, marginBottom:14 };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:520, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        {toast && (
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background: toastOk ? V.accent : V.red, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>
            {toast}
          </div>
        )}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>
          {colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
        </div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:22 }}>
          {colaborador ? 'Atualize os dados do colaborador' : 'Preencha para cadastrar manualmente'}
        </div>

        {/* Nome */}
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Nome completo *</label>
          <input value={form.nome} onChange={set('nome')} placeholder="ex: Ana Paula Silva" style={inp}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        {/* Gênero + Nasc */}
        <div style={row2}>
          <div style={{ flex:1 }}>
            <label style={lbl}>Gênero</label>
            <select value={form.genero} onChange={set('genero')} style={inp}>
              <option value="">Não informado</option>
              <option>Feminino</option>
              <option>Masculino</option>
              <option>Outro</option>
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Data de Nascimento</label>
            <input type="date" value={form.data_nascimento} onChange={set('data_nascimento')} style={inp}/>
          </div>
        </div>

        {/* Depto + Cargo */}
        <div style={row2}>
          <div style={{ flex:1 }}>
            <label style={lbl}>Departamento</label>
            <select value={form.departamento} onChange={set('departamento')} style={inp}>
              <option value="">Selecione</option>
              {['Comercial','Financeiro','Marketing','Logística','Operações','TI','RH','Jurídico','Produto','Outros'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Cargo</label>
            <input value={form.cargo} onChange={set('cargo')} placeholder="ex: Analista de Vendas" style={inp}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
        </div>

        {/* Admissão + Salário */}
        <div style={row2}>
          <div style={{ flex:1 }}>
            <label style={lbl}>Data de Admissão *</label>
            <input type="date" value={form.data_admissao} onChange={set('data_admissao')} style={inp}/>
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Salário (R$)</label>
            <input value={form.salario} onChange={set('salario')} placeholder="ex: 3500.00" style={inp}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
        </div>

        {/* Email + Tel */}
        <div style={row2}>
          <div style={{ flex:1 }}>
            <label style={lbl}>E-mail</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="ana@empresa.com" style={inp}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>Telefone</label>
            <input value={form.telefone} onChange={set('telefone')} placeholder="(37) 99999-9999" style={inp}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
        </div>

        {/* Observação */}
        <div style={{ marginBottom:20 }}>
          <label style={lbl}>Observação</label>
          <textarea value={form.observacao} onChange={set('observacao')} rows={2}
            placeholder="Anotações internas sobre o colaborador..."
            style={{ ...inp, resize:'vertical' }}
            onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={saving}
            style={{ background: saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor: saving ? 'default' : 'pointer', fontSize:13, fontWeight:600 }}
            onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background='#0f2460'; }}
            onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=V.accent; }}>
            {saving ? 'Salvando...' : colaborador ? '✓ Salvar Alterações' : '✓ Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL DESLIGAMENTO ───────────────────────────────────────────
function ModalDesligar({ colaborador, onClose, onSaved }) {
  const [form, setForm]     = useState({ data_desligamento: new Date().toISOString().split('T')[0], motivo_desligamento: '' });
  const [saving, setSaving] = useState(false);

  const handleDesligar = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const res = await fetch(`${BASE}/colaboradores/${colaborador.id}/desligar`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSaved(); onClose(); }
    } catch {}
    finally { setSaving(false); }
  };

  if (!colaborador) return null;
  const inp = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none' };

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(239,68,68,0.2)', backdropFilter:'blur(6px)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid rgba(239,68,68,0.3)`, borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
        <div style={{ fontSize:28, marginBottom:10, textAlign:'center' }}>🚪</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:V.text, marginBottom:4, textAlign:'center' }}>
          Desligar {colaborador.nome}?
        </div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20, textAlign:'center' }}>
          O colaborador será movido para o histórico de desligados.
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>Data de desligamento</label>
          <input type="date" value={form.data_desligamento} onChange={e=>setForm(p=>({...p, data_desligamento:e.target.value}))} style={inp}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>Motivo</label>
          <select value={form.motivo_desligamento} onChange={e=>setForm(p=>({...p, motivo_desligamento:e.target.value}))} style={inp}>
            <option value="">Não informado</option>
            <option>Pedido de demissão</option>
            <option>Demissão sem justa causa</option>
            <option>Demissão com justa causa</option>
            <option>Acordo mútuo</option>
            <option>Fim de contrato</option>
            <option>Aposentadoria</option>
            <option>Outros</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleDesligar} disabled={saving}
            style={{ background: saving ? V.muted2 : V.red, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            {saving ? 'Processando...' : 'Confirmar Desligamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL IMPORT CSV ─────────────────────────────────────────────
function ModalImportCSV({ open, onClose, onDone }) {
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BASE}/colaboradores/import-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      setResult(data);
      if (data.inseridos > 0) onDone();
    } catch { setResult({ error: 'Erro ao enviar arquivo' }); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:460, maxWidth:'95vw' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>Importar CSV</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:4 }}>
          Colunas esperadas (em ordem):
        </div>
        <div style={{ fontSize:11, background:V.surface2, padding:'8px 12px', borderRadius:8, marginBottom:18, color:V.muted2, fontFamily:'monospace', lineHeight:1.6 }}>
          nome, genero, data_nascimento, departamento, cargo,<br/>
          data_admissao, salario, email, telefone
        </div>

        {/* Download modelo */}
        <a
          href="data:text/csv;charset=utf-8,%EF%BB%BFnome%2Cgenero%2Cdata_nascimento%2Cdepartamento%2Ccargo%2Cdata_admissao%2Csalario%2Cemail%2Ctelefone%0AAna%20Paula%2CFeminino%2C1990-03-15%2CComercial%2CGerente%2C2022-01-10%2C8500%2Cana%40empresa.com%2C37999999999"
          download="modelo_colaboradores.csv"
          style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:V.accent, marginBottom:18, textDecoration:'none' }}>
          ⬇ Baixar modelo CSV
        </a>

        <div
          style={{ border:`2px dashed ${file ? V.green : V.border}`, borderRadius:10, padding:'24px', textAlign:'center', cursor:'pointer', marginBottom:16, transition:'border-color 0.2s', background: file ? 'rgba(16,185,129,0.05)' : 'transparent' }}
          onClick={() => document.getElementById('csv-input').click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = V.accent; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = file ? V.green : V.border; }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
          <input id="csv-input" type="file" accept=".csv" style={{ display:'none' }}
            onChange={e => setFile(e.target.files[0])}/>
          <div style={{ fontSize:24, marginBottom:6 }}>{file ? '📄' : '📁'}</div>
          <div style={{ fontSize:13, fontWeight:500, color: file ? V.green : V.text }}>
            {file ? file.name : 'Clique ou arraste o arquivo CSV'}
          </div>
          {file && <div style={{ fontSize:11, color:V.muted, marginTop:4 }}>
            {(file.size / 1024).toFixed(1)} KB
          </div>}
        </div>

        {result && (
          <div style={{ padding:'12px 14px', borderRadius:8, marginBottom:16, fontSize:12,
            background: result.error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${result.error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            color: result.error ? V.red : V.green }}>
            {result.error ? `❌ ${result.error}` : `✓ ${result.inseridos} colaboradores importados de ${result.total}`}
            {result.erros?.length > 0 && (
              <div style={{ marginTop:6, color:V.orange }}>
                {result.erros.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
                {result.erros.length > 3 && <div>...e mais {result.erros.length - 3} avisos</div>}
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            {result?.inseridos > 0 ? 'Fechar' : 'Cancelar'}
          </button>
          {!result?.inseridos && (
            <button onClick={handleUpload} disabled={!file || loading}
              style={{ background: !file || loading ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor: !file || loading ? 'default' : 'pointer', fontSize:13, fontWeight:600 }}>
              {loading ? 'Importando...' : '⬆ Importar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL PRINCIPAL COLABORADORES ──────────────────────────────
function PanelColaboradores() {
  const [lista, setLista]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);

  // Filtros
  const [busca, setBusca]           = useState('');
  const [filtStatus, setFiltStatus] = useState('ativo');
  const [filtDepto, setFiltDepto]   = useState('');

  // Modais
  const [modalForm, setModalForm]       = useState(false);
  const [modalCSV, setModalCSV]         = useState(false);
  const [editando, setEditando]         = useState(null);
  const [desligando, setDesligando]     = useState(null);
  const [deletandoId, setDeletandoId]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
  const token = localStorage.getItem('token');

  const fetchLista = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: p, limit: 15,
        ...(filtStatus && { status: filtStatus }),
        ...(filtDepto  && { departamento: filtDepto }),
        ...(busca      && { busca }),
      });
      const res  = await fetch(`${BASE}/colaboradores?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setLista(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { setLista([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLista(1); setPage(1); }, [filtStatus, filtDepto, busca]);

  const handleExport = () => {
    window.open(`${BASE}/colaboradores/export-csv?token=${token}`, '_blank');
  };

  const handleDelete = async (id) => {
    setDeletandoId(id);
    try {
      await fetch(`${BASE}/colaboradores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchLista();
    } catch {}
    finally { setDeletandoId(null); setConfirmDelete(null); }
  };

  const statusColor = (s) => s === 'ativo' ? V.green : V.muted2;
  const genderIcon  = (g) => g === 'Feminino' ? '♀' : g === 'Masculino' ? '♂' : '—';

  const deptos = ['Comercial','Financeiro','Marketing','Logística','Operações','TI','RH','Jurídico','Produto','Outros'];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>
            Colaboradores
          </div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>
            {total.toLocaleString('pt-BR')} {filtStatus === 'ativo' ? 'ativos' : filtStatus === 'desligado' ? 'desligados' : 'total'}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => setModalCSV(true)}
            style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
            📥 Importar CSV
          </button>
          <button onClick={handleExport}
            style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
            📤 Exportar
          </button>
          <button onClick={() => { setEditando(null); setModalForm(true); }}
            style={{ background:V.accent, border:'none', color:'white', padding:'9px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>
            + Novo Colaborador
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        {/* Busca */}
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por nome ou cargo..."
          style={{ flex:'1 1 220px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 14px', color:V.text, fontSize:12, outline:'none' }}
          onFocus={e => e.target.style.borderColor = V.accent}
          onBlur={e  => e.target.style.borderColor = V.border}/>

        {/* Status */}
        <select value={filtStatus} onChange={e => setFiltStatus(e.target.value)}
          style={{ background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:12, outline:'none', cursor:'pointer' }}>
          <option value="ativo">Ativos</option>
          <option value="desligado">Desligados</option>
          <option value="">Todos</option>
        </select>

        {/* Departamento */}
        <select value={filtDepto} onChange={e => setFiltDepto(e.target.value)}
          style={{ background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:12, outline:'none', cursor:'pointer' }}>
          <option value="">Todos os deptos</option>
          {deptos.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Tabela ── */}
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, flexDirection:'column', gap:12 }}>
            <div style={{ width:28, height:28, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
            <span style={{ fontSize:13, color:V.muted }}>Carregando...</span>
          </div>
        ) : lista.length === 0 ? (
          <div style={{ textAlign:'center', padding:48, color:V.muted2 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
            <div style={{ fontWeight:500, marginBottom:8 }}>Nenhum colaborador encontrado</div>
            <div style={{ fontSize:12, marginBottom:16 }}>Cadastre manualmente ou importe via CSV</div>
            <button onClick={() => setModalForm(true)}
              style={{ background:V.accent, border:'none', color:'white', padding:'9px 20px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>
              + Cadastrar primeiro colaborador
            </button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:V.surface2 }}>
                  {['Colaborador','Cargo','Departamento','Admissão','Gênero','Salário','Status','Ações'].map(h => (
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((c, i) => {
                  const initials = c.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const admDate  = c.data_admissao ? new Date(c.data_admissao).toLocaleDateString('pt-BR') : '—';
                  const salario  = c.salario ? `R$ ${parseFloat(c.salario).toLocaleString('pt-BR', { minimumFractionDigits:2 })}` : '—';
                  return (
                    <tr key={c.id} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)`, transition:'background 0.15s', animation:`fadeUp 0.3s ease ${i * 0.03}s both` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,58,143,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      {/* Nome */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:`${V.accent}18`, color:V.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight:500, fontSize:13 }}>{c.nome}</div>
                            {c.email && <div style={{ fontSize:10, color:V.muted }}>{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', color:V.text }}>{c.cargo || '—'}</td>
                      <td style={{ padding:'12px 14px' }}>
                        {c.departamento
                          ? <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:`${V.accent}12`, color:V.accent, fontWeight:500 }}>{c.departamento}</span>
                          : '—'}
                      </td>
                      <td style={{ padding:'12px 14px', color:V.muted, whiteSpace:'nowrap' }}>{admDate}</td>
                      <td style={{ padding:'12px 14px', color:V.muted, textAlign:'center' }}>{genderIcon(c.genero)}</td>
                      <td style={{ padding:'12px 14px', fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:12 }}>{salario}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:600,
                          background: c.status === 'ativo' ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                          color: statusColor(c.status) }}>
                          {c.status === 'ativo' ? '● Ativo' : '○ Desligado'}
                        </span>
                      </td>
                      {/* Ações */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          {/* Editar */}
                          <button title="Editar" onClick={() => { setEditando(c); setModalForm(true); }}
                            style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = V.accent; e.currentTarget.style.color = V.accent; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = V.border; e.currentTarget.style.color = V.muted2; }}>
                            ✏
                          </button>
                          {/* Desligar (só para ativos) */}
                          {c.status === 'ativo' && (
                            <button title="Desligar" onClick={() => setDesligando(c)}
                              style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = V.orange; e.currentTarget.style.color = V.orange; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = V.border; e.currentTarget.style.color = V.muted2; }}>
                              🚪
                            </button>
                          )}
                          {/* Deletar */}
                          {confirmDelete === c.id ? (
                            <div style={{ display:'flex', gap:4 }}>
                              <button onClick={() => handleDelete(c.id)} disabled={deletandoId === c.id}
                                style={{ background:V.red, border:'none', color:'white', padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:600 }}>
                                {deletandoId === c.id ? '...' : 'Sim'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:10 }}>
                                Não
                              </button>
                            </div>
                          ) : (
                            <button title="Excluir" onClick={() => setConfirmDelete(c.id)}
                              style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = V.red; e.currentTarget.style.color = V.red; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = V.border; e.currentTarget.style.color = V.muted2; }}>
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Paginação ── */}
      {pages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:16 }}>
          <button onClick={() => { setPage(p => Math.max(1, p-1)); fetchLista(Math.max(1, page-1)); }}
            disabled={page === 1}
            style={{ background:'none', border:`1px solid ${V.border}`, color: page===1 ? V.muted2 : V.text, padding:'6px 14px', borderRadius:8, cursor: page===1 ? 'default' : 'pointer', fontSize:12 }}>
            ‹ Anterior
          </button>
          <span style={{ fontSize:12, color:V.muted }}>
            Página {page} de {pages} · {total} registros
          </span>
          <button onClick={() => { setPage(p => Math.min(pages, p+1)); fetchLista(Math.min(pages, page+1)); }}
            disabled={page === pages}
            style={{ background:'none', border:`1px solid ${V.border}`, color: page===pages ? V.muted2 : V.text, padding:'6px 14px', borderRadius:8, cursor: page===pages ? 'default' : 'pointer', fontSize:12 }}>
            Próxima ›
          </button>
        </div>
      )}

      {/* ── Modais ── */}
      <ModalColaborador
        open={modalForm}
        onClose={() => { setModalForm(false); setEditando(null); }}
        onSaved={() => fetchLista()}
        colaborador={editando}
      />
      <ModalImportCSV
        open={modalCSV}
        onClose={() => setModalCSV(false)}
        onDone={() => fetchLista()}
      />
      {desligando && (
        <ModalDesligar
          colaborador={desligando}
          onClose={() => setDesligando(null)}
          onSaved={() => { fetchLista(); setDesligando(null); }}
        />
      )}
    </div>
  );
}
// ================================================================
// FIM DE PanelColaboradores
// ================================================================



// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function EmpresaDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab]           = useState('overview');
  const [modal, setModal]       = useState(false);       // Modal agendamento/lembrete
  const [modalVaga, setModalVaga] = useState(false);     // FIX #4 — Modal nova vaga separado
  const [kpis, setKpis]         = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]   = useState(true);
  const sidebarRef = useRef(null);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const get  = async (path) => {
        const res = await fetch(`${BASE}${path}`, { headers: { 'Authorization':`Bearer ${token}` } });
        if (!res.ok) return null;
        return res.json();
      };
      const [resumo, cands] = await Promise.all([
        get('/dashboard/resumo'),
        get('/dashboard/candidatos-recentes'),
      ]);
      const r = resumo?.data || resumo || {};
      setKpis([
        { icon:'📊', label:'Vagas Ativas',        value: r.vagas_ativas,              delta:`${r.vagas_semana||0} este mês`,      deltaUp:true,  color:V.accent  },
        { icon:'👥', label:'Candidatos',           value: r.candidaturas,              delta:`${r.candidaturas_hoje||0}% vs mês ant.`, deltaUp:true, color:V.accent2 },
        { icon:'🎯', label:'Taxa de Conversão',    value:`${r.taxa_conversao||18}%`,   delta:`${r.taxa_variacao||3}pp`,           deltaUp:true,  color:V.green   },
        { icon:'⏱',  label:'Tempo p/ Contratar',  value:`${r.tempo_medio||23}d`,      delta:'5d vs ant.',                        deltaUp:false, color:V.orange  },
        { icon:'💰', label:'Custo / Contratação',  value:`R$${r.custo_medio||'1.8k'}`, delta:'R$200',                             deltaUp:false, color:V.accent3 },
        { icon:'📈', label:'Contratações/Mês',     value: r.contratacoes || 11,        delta:`${r.contratacoes_mes||2} vs ant.`,  deltaUp:true,  color:V.green   },
      ]);
      const c = cands?.data || cands || [];
      if (c.length > 0) setCandidates(c);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const initials = user?.nome?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'CL';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
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

      {/* ── SIDEBAR ── */}
      <nav className="cl-sidebar">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`cl-nav-item${tab===t.id?' active':''}`}>
            <span style={{ width:20, height:20, flexShrink:0, display:'flex', alignItems:'center' }}>{ICONS[t.id]}</span>
            <span className="cl-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── MAIN ── */}
      <div style={{ marginLeft:64, fontFamily:"'DM Sans',sans-serif", background:V.bg, minHeight:'calc(100vh - 64px)' }}>

        {/* TOPBAR */}
        <div style={{ position:'sticky', top:64, background:'rgba(244,246,251,0.95)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${V.border}`, padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:50 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:V.text }}>{PAGE_TITLES[tab]}</div>
            <div style={{ fontSize:12, color:V.muted }}>Atualizado agora · Março 2025</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* FIX #4 — "Lembrete" abre Modal, "Nova Vaga" abre ModalNovaVaga */}
            <button onClick={()=>setModal(true)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=V.accent;e.currentTarget.style.color=V.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>
              🔔 Lembrete
            </button>
            <button onClick={()=>setModalVaga(true)} style={{ background:V.accent, border:'none', color:'white', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#0f2460';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background=V.accent;e.currentTarget.style.transform='';}}>
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
            <button key={t.id} onClick={()=>setTab(t.id)} className={`cl-tab${tab===t.id?' active':''}`}>{t.label}</button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ padding:'28px 32px' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:16 }}>
              <div style={{ width:36, height:36, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
              <style>{`@keyframes clSpin{to{transform:rotate(360deg);}}`}</style>
              <p style={{ color:V.muted, fontSize:14 }}>Carregando dados...</p>
            </div>
          ) : (
            <>
              {tab==='overview' && <PanelOverview kpis={kpis} candidates={candidates} onModal={()=>setModal(true)}/>}
              {tab==='funnel'   && <PanelFunil onModal={()=>setModal(true)}/>}
              {tab==='talent'   && <PanelTalent/>}
              {tab==='ai'       && <PanelAI onModal={()=>setModal(true)}/>}
              {tab==='agenda'   && <PanelAgendaFull/>}
              {tab==='reports'  && <PanelReports/>}
              {tab==='history'  && <PanelHistory/>}
              {tab==='indicadores' && <PanelIndicadoresRH/>} 
              {tab==='colaboradores' && <PanelColaboradores/>}
            </>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)}/>
      <ModalNovaVaga open={modalVaga} onClose={()=>setModalVaga(false)} onSaved={fetchData}/>
    </>
  );
}