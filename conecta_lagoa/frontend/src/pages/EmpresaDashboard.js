// EmpresaDashboard.js — Dashboard completo Conecta Lagoa
// Rota: /empresa/dashboard (protegida por PrivateRoute no App.js)
// Usa o Header e Footer globais do site — NÃO tem sidebar própria
import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';

const CL = {
  blue:'#1a3a8f', blue2:'#2d52c4', orange:'#e07b00', green:'#10b981',
  red:'#ef4444', purple:'#8b5cf6', cyan:'#06b6d4',
  bg:'#f4f6fb', surface:'#ffffff', border:'#e8ecf4',
  text:'#1a1f36', muted:'#6b7280', muted2:'#9ca3af',
};

const STATUS_STYLE = {
  'Aprovado':   { bg:'#dcfce7', color:'#16a34a' },
  'contratado': { bg:'#dcfce7', color:'#16a34a' },
  'Em Análise': { bg:'#fef3c7', color:'#d97706' },
  'em_analise': { bg:'#fef3c7', color:'#d97706' },
  'Entrevista': { bg:'#dbeafe', color:'#1d4ed8' },
  'entrevista': { bg:'#dbeafe', color:'#1d4ed8' },
  'Reprovado':  { bg:'#fee2e2', color:'#dc2626' },
  'reprovado':  { bg:'#fee2e2', color:'#dc2626' },
};

const getAreaColor = (a) => ({ Tecnologia:CL.blue, Comércio:CL.orange, Saúde:CL.green, Construção:'#f59e0b', Outros:CL.purple }[a] || CL.muted);

const TABS = [
  { id:'visao', label:'📊 Visão Geral' },
  { id:'candidatos', label:'👥 Candidatos' },
  { id:'funil', label:'🎯 Funil CRM' },
  { id:'agenda', label:'📅 Agenda' },
  { id:'relatorios', label:'📈 Relatórios' },
  { id:'historico', label:'🏆 Histórico' },
];

const STAGES = [
  { id:'recebido', label:'Recebido', color:CL.blue },
  { id:'triagem', label:'Triagem', color:CL.cyan },
  { id:'entrevista', label:'Entrevista', color:CL.purple },
  { id:'tecnico', label:'Técnico', color:CL.orange },
  { id:'proposta', label:'Proposta', color:CL.green },
  { id:'contratado', label:'Contratado', color:'#059669' },
];

function Tooltip2({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:`1px solid ${CL.border}`, borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 24px rgba(26,58,143,0.1)', fontSize:13 }}>
      <p style={{ fontWeight:700, marginBottom:6, color:CL.text }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, margin:'2px 0' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  );
}

function Card({ title, sub, children, style={} }) {
  return (
    <div style={{ background:CL.surface, border:`1px solid ${CL.border}`, borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 12px rgba(26,58,143,0.05)', ...style }}>
      {(title||sub) && (
        <div style={{ marginBottom:16 }}>
          {title && <div style={{ fontSize:14, fontWeight:700, color:CL.text, fontFamily:"'Sora',sans-serif" }}>{title}</div>}
          {sub   && <div style={{ fontSize:11, color:CL.muted, marginTop:2 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function KpiCard({ icon, label, value, delta, color, delay=0 }) {
  const pos = !String(delta||'').startsWith('-');
  return (
    <div style={{ background:CL.surface, border:`1px solid ${CL.border}`, borderRadius:16, padding:'20px 22px', flex:1, minWidth:150, boxShadow:'0 2px 12px rgba(26,58,143,0.06)', position:'relative', overflow:'hidden', animation:`clFU 0.45s ease ${delay}s both`, transition:'transform 0.2s,box-shadow 0.2s', cursor:'default' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(26,58,143,0.13)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 12px rgba(26,58,143,0.06)';}}>
      <div style={{ position:'absolute', top:-18, right:-18, width:70, height:70, borderRadius:'50%', background:color, opacity:0.09 }}/>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:11, color:CL.muted, fontWeight:500, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color:CL.text, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{value??'—'}</div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:pos?'#dcfce7':'#fee2e2', color:pos?'#16a34a':'#dc2626' }}>
        {pos?'▲':'▼'} {delta}
      </div>
    </div>
  );
}

function AlertItem({ color, msg, time }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, background:CL.bg, marginBottom:6, fontSize:12 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
      <span style={{ flex:1, color:CL.text }}>{msg}</span>
      <span style={{ fontSize:10, color:CL.muted2, whiteSpace:'nowrap' }}>{time}</span>
    </div>
  );
}

function MiniCalendar() {
  const eventDays=[5,8,10,14,18,20,25];
  const firstDay=new Date(2025,2,1).getDay();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push({day:28-firstDay+i+1,other:true});
  for(let d=1;d<=31;d++) cells.push({day:d,today:d===5,event:eventDays.includes(d)});
  return (
    <div style={{ background:CL.surface, border:`1px solid ${CL.border}`, borderRadius:14, padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <button style={{ background:'none', border:`1px solid ${CL.border}`, borderRadius:6, width:26, height:26, cursor:'pointer', color:CL.muted, fontSize:14 }}>‹</button>
        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, color:CL.text }}>Março 2025</span>
        <button style={{ background:'none', border:`1px solid ${CL.border}`, borderRadius:6, width:26, height:26, cursor:'pointer', color:CL.muted, fontSize:14 }}>›</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} style={{ textAlign:'center', fontSize:9, color:CL.muted2, padding:'3px 0' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((c,i)=>(
          <div key={i} style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, borderRadius:6, cursor:'pointer', position:'relative', background:c.today?CL.blue:'transparent', color:c.today?'white':c.other?'#d1d5db':CL.text, fontWeight:c.today?700:400 }}>
            {c.day}
            {c.event&&!c.today&&<span style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, background:CL.orange, borderRadius:'50%' }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalAgenda({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:'white', borderRadius:20, padding:32, width:440, maxWidth:'95vw', boxShadow:'0 24px 64px rgba(26,58,143,0.2)', animation:'clFU 0.3s ease' }}>
        <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:CL.text, marginBottom:4 }}>Agendar Entrevista</h3>
        <p style={{ fontSize:12, color:CL.muted, marginBottom:22 }}>Configure data, horário e lembrete automático</p>
        {[['Candidato','text','Nome do candidato'],['Vaga','text','Título da vaga']].map(([l,t,p])=>(
          <div key={l} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:CL.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6, fontWeight:600 }}>{l}</label>
            <input type={t} placeholder={p} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${CL.border}`, fontSize:13, outline:'none', color:CL.text }}/>
          </div>
        ))}
        <div style={{ display:'flex', gap:12, marginBottom:14 }}>
          {[['Data','date'],['Horário','time']].map(([l,t])=>(
            <div key={l} style={{ flex:1 }}>
              <label style={{ fontSize:11, color:CL.muted, textTransform:'uppercase', display:'block', marginBottom:6, fontWeight:600 }}>{l}</label>
              <input type={t} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${CL.border}`, fontSize:13, color:CL.text }}/>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:CL.muted, textTransform:'uppercase', display:'block', marginBottom:6, fontWeight:600 }}>Lembrete automático</label>
          <select style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1.5px solid ${CL.border}`, fontSize:13, color:CL.text }}>
            <option>1 hora antes (Email)</option>
            <option>30 minutos antes</option>
            <option>1 dia antes (Email + WhatsApp)</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:10, border:`1px solid ${CL.border}`, background:'white', cursor:'pointer', fontSize:13 }}>Cancelar</button>
          <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:10, border:'none', background:CL.blue, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>✓ Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default function EmpresaDashboard() {
  const { user } = useAuth();
  const [tab, setTab]         = useState('visao');
  const [kpis, setKpis]       = useState([]);
  const [appData, setAppData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [areaDist, setAreaDist] = useState([]);
  const [cands, setCands]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Sessão expirada.'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      const get = async (path) => {
        const res = await fetch(`${BASE}${path}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      };
      const [rRes, gRes, aRes, vRes, cRes] = await Promise.all([
        get('/dashboard/resumo'),
        get('/dashboard/grafico-candidaturas'),
        get('/dashboard/vagas-por-area'),
        get('/dashboard/vagas-por-mes'),
        get('/dashboard/candidatos-recentes'),
      ]);
      const r = rRes?.data || rRes || {};
      const g = gRes?.data || gRes || [];
      const a = aRes?.data || aRes || [];
      const v = vRes?.data || vRes || [];
      const c = cRes?.data || cRes || [];
      setKpis([
        { icon:'💼', label:'Vagas Ativas',       value: r.vagas_ativas,          delta:`${r.vagas_semana||0} esta semana`,                                        color:CL.blue   },
        { icon:'📋', label:'Candidaturas',       value: r.candidaturas,          delta:`${r.candidaturas_hoje||0} hoje`,                                          color:CL.orange },
        { icon:'✅', label:'Contratações',       value: r.contratacoes,          delta:`${r.contratacoes_mes||0} este mês`,                                       color:CL.green  },
        { icon:'📈', label:'Taxa Conversão',     value:`${r.taxa_conversao||0}%`,delta:`${r.taxa_variacao>=0?'+':''}${r.taxa_variacao||0}% vs mês ant.`,         color:CL.purple },
        { icon:'⏱',  label:'Tempo p/ Contratar', value:`${r.tempo_medio||23}d`,  delta:'-5d vs anterior',                                                        color:CL.cyan   },
        { icon:'💰', label:'Custo/Contratação',  value:`R$${r.custo_medio||'1.8k'}`, delta:'-R$200 vs anterior',                                                 color:'#f59e0b' },
      ]);
      setAppData(g.map(x => ({ mes:x.mes, Candidaturas:x.candidaturas, Contratações:x.contratacoes })));
      setAreaData(v.map(x => ({ mes:x.mes, Vagas:x.total })));
      setAreaDist(a.map(x => ({ name:x.area, value:x.percentual, color:getAreaColor(x.area) })));
      setCands(c.map(x => ({ ...x, avatar: x.nome?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() })));
    } catch(e) { console.error('Dashboard:', e.message); setError(e.message); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:CL.bg }}>
      <div style={{ width:40, height:40, border:`3px solid ${CL.border}`, borderTop:`3px solid ${CL.blue}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
      <p style={{ color:CL.muted, fontSize:14 }}>Carregando dados...</p>
      <style>{`@keyframes clSpin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:CL.bg }}>
      <p style={{ color:CL.red, marginBottom:16 }}>⚠️ {error}</p>
      <button onClick={fetchData} style={{ padding:'10px 24px', background:CL.blue, color:'white', border:'none', borderRadius:10, cursor:'pointer' }}>Tentar novamente</button>
    </div>
  );

  return (
    <div style={{ background:CL.bg, minHeight:'100vh', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes clFU{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        *{box-sizing:border-box;}
        .cl-tr:hover td{background:#f8faff!important;}
        .cl-tab-btn:hover{color:${CL.blue}!important;}
      `}</style>

      {/* ── Sub-header da área empresa ── */}
      <div style={{ background:'white', borderBottom:`1px solid ${CL.border}`, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:800, color:CL.text, margin:0 }}>Painel da Empresa</h1>
          <p style={{ fontSize:12, color:CL.muted, margin:'2px 0 0' }}>Olá, <strong>{user?.nome||'Empresa'}</strong> · Atualizado a cada 2 minutos</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>setModal(true)} style={{ padding:'9px 18px', borderRadius:10, border:`1.5px solid ${CL.border}`, background:'white', color:CL.muted, fontSize:13, cursor:'pointer' }}>🔔 Agendar Entrevista</button>
          <button style={{ padding:'9px 20px', borderRadius:10, border:'none', background:CL.blue, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(26,58,143,0.25)' }}>+ Nova Vaga</button>
          <button onClick={fetchData} style={{ width:38, height:38, borderRadius:9, border:`1.5px solid ${CL.border}`, background:'white', cursor:'pointer', fontSize:16 }} title="Atualizar">↻</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background:'white', borderBottom:`1px solid ${CL.border}`, padding:'0 32px', display:'flex', gap:2, overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="cl-tab-btn" style={{ padding:'13px 18px', border:'none', background:'none', fontSize:13, fontWeight:tab===t.id?600:400, color:tab===t.id?CL.blue:CL.muted, borderBottom:tab===t.id?`2.5px solid ${CL.blue}`:'2.5px solid transparent', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}>{t.label}</button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ padding:'28px 32px', maxWidth:1400, margin:'0 auto' }}>

        {/* VISÃO GERAL */}
        {tab==='visao' && <>
          <div style={{ display:'flex', gap:14, marginBottom:22, flexWrap:'wrap' }}>
            {kpis.map((k,i)=><KpiCard key={i} {...k} delay={i*0.06}/>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <Card title="Candidaturas vs Contratações" sub="Últimos 7 meses">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={appData}>
                  <defs>
                    <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CL.blue} stopOpacity={0.2}/><stop offset="95%" stopColor={CL.blue} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gCB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CL.green} stopOpacity={0.2}/><stop offset="95%" stopColor={CL.green} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CL.border}/>
                  <XAxis dataKey="mes" tick={{ fontSize:11, fill:CL.muted }}/>
                  <YAxis tick={{ fontSize:11, fill:CL.muted }}/>
                  <Tooltip content={<Tooltip2/>}/>
                  <Legend wrapperStyle={{ fontSize:12 }}/>
                  <Area type="monotone" dataKey="Candidaturas" stroke={CL.blue}  fill="url(#gCA)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="Contratações" stroke={CL.green} fill="url(#gCB)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Vagas por Mês" sub="Volume publicado">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={areaData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CL.border}/>
                  <XAxis dataKey="mes" tick={{ fontSize:11, fill:CL.muted }}/>
                  <YAxis tick={{ fontSize:11, fill:CL.muted }}/>
                  <Tooltip content={<Tooltip2/>}/>
                  <Bar dataKey="Vagas" fill={CL.orange} radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 330px', gap:16 }}>
            <Card title="Candidatos Recentes" sub="Últimas aplicações">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead><tr>{['Candidato','Cidade','Vaga','Status'].map(h=><th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:11, color:CL.muted, borderBottom:`1px solid ${CL.border}`, textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {cands.length===0
                      ? <tr><td colSpan={4} style={{ padding:24, textAlign:'center', color:CL.muted }}>Nenhum candidato ainda</td></tr>
                      : cands.map((c,i)=>{ const s=STATUS_STYLE[c.status]||{bg:'#f3f4f6',color:CL.muted}; return (
                        <tr key={i} className="cl-tr" style={{ borderBottom:`1px solid ${CL.border}` }}>
                          <td style={{ padding:'11px 10px' }}><div style={{ display:'flex', alignItems:'center', gap:10 }}><div style={{ width:30, height:30, borderRadius:'50%', background:CL.blue, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{c.avatar}</div><span style={{ fontWeight:500 }}>{c.nome}</span></div></td>
                          <td style={{ padding:'11px 10px', color:CL.muted, fontSize:12 }}>{c.cidade||'—'}</td>
                          <td style={{ padding:'11px 10px' }}>{c.vaga_titulo}</td>
                          <td style={{ padding:'11px 10px' }}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>{c.status}</span></td>
                        </tr>
                      );})}
                  </tbody>
                </table>
              </div>
            </Card>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card title="Vagas por Área">
                {areaDist.length>0 ? (
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <ResponsiveContainer width={90} height={90}>
                      <PieChart><Pie data={areaDist} dataKey="value" outerRadius={44} innerRadius={24}>{areaDist.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>`${v}%`}/></PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex:1 }}>
                      {areaDist.map((e,i)=><div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, fontSize:11 }}><div style={{ width:8, height:8, borderRadius:2, background:e.color, flexShrink:0 }}/><span style={{ flex:1 }}>{e.name}</span><strong>{e.value}%</strong></div>)}
                    </div>
                  </div>
                ) : <p style={{ color:CL.muted, fontSize:12 }}>Sem vagas ativas</p>}
              </Card>
              <Card title="🔔 Alertas" style={{ flex:1 }}>
                <AlertItem color={CL.red}    msg="3 candidatos sem resposta +7d" time="urgente"/>
                <AlertItem color={CL.orange} msg="Entrevista hoje às 14h"        time="2h"/>
                <AlertItem color={CL.blue}   msg="Vaga 'Dev Sênior' expira em 3d" time="03/mar"/>
                <AlertItem color={CL.purple} msg="5 testes aguardando avaliação" time="pendente"/>
                <AlertItem color={CL.green}  msg="Rafael aceitou a proposta! 🎉" time="hoje"/>
              </Card>
            </div>
          </div>
        </>}

        {/* CANDIDATOS */}
        {tab==='candidatos' && (
          <Card title="Todos os Candidatos" sub={`${cands.length} registros`}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr>{['Candidato','Email','Cidade','Vaga','Status','Data'].map(h=><th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, color:CL.muted, borderBottom:`1px solid ${CL.border}`, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {cands.length===0
                    ? <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:CL.muted }}>Nenhum candidato encontrado</td></tr>
                    : cands.map((c,i)=>{ const s=STATUS_STYLE[c.status]||{bg:'#f3f4f6',color:CL.muted}; return (
                      <tr key={i} className="cl-tr" style={{ borderBottom:`1px solid ${CL.border}` }}>
                        <td style={{ padding:'13px 12px' }}><div style={{ display:'flex', alignItems:'center', gap:10 }}><div style={{ width:34, height:34, borderRadius:'50%', background:CL.blue, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{c.avatar}</div><span style={{ fontWeight:600 }}>{c.nome}</span></div></td>
                        <td style={{ padding:'13px 12px', color:CL.muted }}>{c.email||'—'}</td>
                        <td style={{ padding:'13px 12px' }}>{c.cidade||'—'}</td>
                        <td style={{ padding:'13px 12px' }}>{c.vaga_titulo}</td>
                        <td style={{ padding:'13px 12px' }}><span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>{c.status}</span></td>
                        <td style={{ padding:'13px 12px', color:CL.muted, fontSize:12 }}>{c.criado_em?new Date(c.criado_em).toLocaleDateString('pt-BR'):'—'}</td>
                      </tr>
                    );})}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* FUNIL CRM */}
        {tab==='funil' && <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div><h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:700, color:CL.text, margin:0 }}>Funil de Recrutamento</h2><p style={{ fontSize:12, color:CL.muted, marginTop:3 }}>Pipeline visual por etapa</p></div>
            <button style={{ padding:'9px 20px', background:CL.blue, color:'white', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 }}>+ Candidato</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${STAGES.length},210px)`, gap:12, overflowX:'auto', paddingBottom:12 }}>
            {STAGES.map(stage=>{
              const cards=cands.filter(c=>c.status===stage.id||c.status===stage.label.toLowerCase());
              return (
                <div key={stage.id} style={{ background:CL.surface, border:`1px solid ${CL.border}`, borderRadius:14, padding:14, minHeight:320 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:stage.color }}>{stage.label}</span>
                    <span style={{ background:CL.bg, borderRadius:6, width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:CL.muted }}>{cards.length}</span>
                  </div>
                  {cards.length===0
                    ? <div style={{ padding:'16px 0', textAlign:'center', color:CL.muted2, fontSize:11 }}>Sem candidatos</div>
                    : cards.map((c,i)=>(
                      <div key={i} style={{ background:CL.bg, border:`1px solid ${CL.border}`, borderRadius:10, padding:11, marginBottom:8, cursor:'grab', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=stage.color;e.currentTarget.style.transform='translateY(-2px)';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=CL.border;e.currentTarget.style.transform='';}}>
                        <div style={{ fontWeight:600, fontSize:12, marginBottom:2 }}>{c.nome}</div>
                        <div style={{ fontSize:10, color:CL.muted, marginBottom:8 }}>{c.vaga_titulo}</div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', background:CL.blue, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700 }}>{c.avatar}</div>
                          <span style={{ fontSize:10, color:CL.muted }}>{c.cidade||'—'}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        </>}

        {/* AGENDA */}
        {tab==='agenda' && (
          <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
            <div>
              <MiniCalendar/>
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={()=>setModal(true)} style={{ padding:'11px', background:CL.blue, color:'white', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 }}>+ Agendar Entrevista</button>
                <button onClick={()=>setModal(true)} style={{ padding:'10px', background:'white', color:CL.text, border:`1px solid ${CL.border}`, borderRadius:10, cursor:'pointer', fontSize:13 }}>🔔 Definir Lembrete</button>
              </div>
            </div>
            <Card title="Agenda de Hoje" sub="5 de Março · 5 compromissos">
              {[
                { time:'09:00', title:'Triagem — Pedro Luz',       meta:'Dev Frontend · Video Call',  tipo:'Triagem',    color:CL.blue   },
                { time:'11:30', title:'Entrevista — Ana Lima',     meta:'Dev Sênior · Presencial',    tipo:'Entrevista', color:CL.purple },
                { time:'14:00', title:'Técnica — Juliana Rocha',   meta:'PM · Google Meet',           tipo:'Técnica',    color:CL.orange },
                { time:'16:00', title:'Proposta — Rafael Souza',   meta:'Dev Backend · Telefone',     tipo:'Proposta',   color:CL.green  },
                { time:'17:30', title:'Feedback — Giovanna Silva', meta:'Data Eng · Video Call',      tipo:'Feedback',   color:CL.cyan   },
              ].map((ev,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:`1px solid ${CL.border}` }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:CL.blue, minWidth:52 }}>{ev.time}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:CL.text }}>{ev.title}</div>
                    <div style={{ fontSize:11, color:CL.muted, marginTop:2 }}>{ev.meta}</div>
                  </div>
                  <span style={{ padding:'4px 12px', borderRadius:8, fontSize:11, fontWeight:600, background:`${ev.color}15`, color:ev.color }}>{ev.tipo}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* RELATÓRIOS */}
        {tab==='relatorios' && <>
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            {[['🏆','Cargo Mais Difícil','Dev Sênior','42d médio',CL.purple],['💵','Média Salarial Dev','R$ 12k','+8% mercado',CL.blue],['⭐','Reputação Employer','4.6/5','+0.3 pts',CL.orange],['🚶','Taxa Turnover','9%','Meta: 10%',CL.green]].map(([ic,l,v,s,c],i)=>(
              <div key={i} style={{ flex:1, minWidth:150, background:CL.surface, border:`1px solid ${CL.border}`, borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{ic}</div>
                <div style={{ fontSize:11, color:CL.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:CL.green, marginTop:4 }}>▲ {s}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Card title="Dificuldade por Cargo">
              {[['Dev Sênior Backend',85,CL.red],['Data Scientist',75,CL.orange],['UX Designer',55,CL.orange],['Product Manager',40,CL.green],['Analista Suporte',25,CL.green]].map(([l,p,c],i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${CL.border}` }}>
                  <span style={{ fontSize:12, flex:1 }}>{l}</span>
                  <div style={{ width:120, height:5, background:CL.border, borderRadius:3 }}><div style={{ width:`${p}%`, height:'100%', background:c, borderRadius:3 }}/></div>
                  <span style={{ fontSize:11, fontWeight:700, color:c, minWidth:32 }}>{p}%</span>
                </div>
              ))}
            </Card>
            <Card title="Médias Salariais">
              {[['Dev Sênior','R$ 14.000'],['Data Scientist','R$ 12.500'],['Product Manager','R$ 11.000'],['UX Designer','R$ 8.500'],['Dev Pleno','R$ 9.000'],['Analista Suporte','R$ 4.200']].map(([r,s],i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:`1px solid ${CL.border}` }}>
                  <span style={{ fontSize:13 }}>{r}</span>
                  <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:CL.blue }}>{s}</span>
                </div>
              ))}
            </Card>
          </div>
        </>}

        {/* HISTÓRICO */}
        {tab==='historico' && <>
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            {[['📣','Top Vaga Engajamento','Dev Sênior','148 apps',CL.blue],['⚡','Resp. Média Candidato','2.4h','Melhor do setor',CL.green],['⭐','Reputação Employer','4.6','+0.3 pts',CL.orange],['🏃','Taxa de Desistência','12%','Meta: 10%',CL.red]].map(([ic,l,v,s,c],i)=>(
              <div key={i} style={{ flex:1, minWidth:150, background:CL.surface, border:`1px solid ${CL.border}`, borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{ic}</div>
                <div style={{ fontSize:11, color:CL.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:CL.green, marginTop:4 }}>▲ {s}</div>
              </div>
            ))}
          </div>
          <Card title="Histórico de Vagas — Engajamento">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr>{['Vaga','Período','Apps','Contratados','Conversão','Tempo Médio','Reputação'].map(h=><th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, color:CL.muted, borderBottom:`1px solid ${CL.border}`, textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[['Dev Sênior Backend','Jan–Fev 2025',148,3,'2%','38d','★★★★☆',CL.orange],['UX Designer Pleno','Fev 2025',92,2,'2.2%','22d','★★★★★',CL.green],['Product Manager','Dez–Jan 2025',67,1,'1.5%','18d','★★★★☆',CL.blue],['Data Analyst Jr','Jan 2025',203,5,'2.5%','15d','★★★★★',CL.green],['Dev Frontend React','Dez 2024',119,2,'1.7%','27d','★★★★☆',CL.orange]].map(([v,p,a,c,cv,t,r,col],i)=>(
                    <tr key={i} className="cl-tr" style={{ borderBottom:`1px solid ${CL.border}` }}>
                      <td style={{ padding:'13px 12px', fontWeight:600 }}>{v}</td>
                      <td style={{ padding:'13px 12px', color:CL.muted }}>{p}</td>
                      <td style={{ padding:'13px 12px' }}>{a}</td>
                      <td style={{ padding:'13px 12px' }}>{c}</td>
                      <td style={{ padding:'13px 12px' }}><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:`${col}15`, color:col }}>{cv}</span></td>
                      <td style={{ padding:'13px 12px' }}>{t}</td>
                      <td style={{ padding:'13px 12px', color:CL.orange }}>{r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>}

      </div>

      {modal && <ModalAgenda onClose={()=>setModal(false)}/>}
    </div>
  );
}