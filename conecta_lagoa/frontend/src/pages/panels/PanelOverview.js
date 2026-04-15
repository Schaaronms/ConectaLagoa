// PanelOverview.js — Conecta Lagoa (sem mock data)
import { Card, KpiCard, Spinner, Pill, V, PILL_LABEL } from './shared';

const KPI_META = [
  { icon: '💼', color: '#1a3a8f' },
  { icon: '👥', color: '#2d52c4' },
  { icon: '✨', color: '#10b981' },
  { icon: '⏱',  color: '#e07b00' },
  { icon: '💰', color: '#10b981' },
];

const STATUS_PILL = {
  'Enviado':    'pill-cyan',
  'Visualizado':'pill-cyan',
  'Em Análise': 'pill-orange',
  'Entrevista': 'pill-purple',
  'Aprovado':   'pill-green',
  'Reprovado':  'pill-red',
};

const AVATAR_COLORS = ['#1a3a8f', '#2d52c4', '#10b981', '#e07b00'];

const Empty = ({ icon, text }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:120, flexDirection:'column', gap:8 }}>
    <span style={{ fontSize:26, opacity:0.25 }}>{icon}</span>
    <p style={{ fontSize:12, color:V.muted, textAlign:'center', lineHeight:1.5 }}>{text}</p>
  </div>
);

function BarChart({ evolucao }) {
  if (!evolucao?.length) {
    return (
      <Card title="Evolucao mensal" sub="Candidatos vs contratacoes" badge={String(new Date().getFullYear())} badgeColor="blue">
        <Empty icon="📊" text="Nenhum dado ainda. As candidaturas aparecerão aqui." />
      </Card>
    );
  }

  const data = evolucao.slice(0, 6).map(d => ({
    mes:          d.mes || '-',
    candidatos:   Number(d.candidatos ?? d.c ?? 0),
    contratacoes: Number(d.contratacoes ?? d.h ?? 0),
  }));
  const maxVal = Math.max(...data.flatMap(d => [d.candidatos, d.contratacoes]), 1);

  return (
    <Card title="Evolução mensal" sub="Candidatos vs contratações" badge={String(new Date().getFullYear())} badgeColor="blue">
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:90 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex:1, display:'flex', alignItems:'flex-end', gap:2, height:90 }}>
            <div title={'Candidatos: ' + d.candidatos}
              style={{ flex:1, height:Math.max((d.candidatos/maxVal)*90,3), background:'#1a3a8f', borderRadius:'3px 3px 0 0', transition:'height 0.5s' }} />
            <div title={'Contratações: ' + d.contratacoes}
              style={{ flex:1, height:Math.max((d.contratacoes/maxVal)*90,3), background:'#e07b00', borderRadius:'3px 3px 0 0', transition:'height 0.5s' }} />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginTop:5 }}>
        {data.map((d, i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:10, color:'#9ca3af' }}>{d.mes}</div>)}
      </div>
      <div style={{ display:'flex', gap:14, marginTop:10 }}>
        {[['Candidatos','#1a3a8f'],['Contratações','#e07b00']].map(([lbl, color]) => (
          <div key={lbl} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#6b7280' }}>
            <div style={{ width:9, height:9, borderRadius:2, background:color }} />{lbl}
          </div>
        ))}
      </div>
    </Card>
  );
}

function FunnelCard({ funil }) {
  if (!funil?.length) {
    return (
      <Card title="Funil geral" sub="Pipeline atual" badge="Ao vivo" badgeColor="green">
        <Empty icon="🔽" text="Sem candidaturas no pipeline ainda." />
      </Card>
    );
  }

  const items = funil.map(f => ({
    label: f.name || f.etapa || f.label || '-',
    value: Number(f.count ?? f.total ?? f.value ?? 0),
    color: f.color || '#1a3a8f',
  }));
  const max = Math.max(...items.map(i => i.value), 1);

  return (
    <Card title="Funil geral" sub="Pipeline atual" badge="Ao vivo" badgeColor="green">
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:item.color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:'#6b7280', width:88, flexShrink:0 }}>{item.label}</span>
            <div style={{ flex:1, height:5, background:'#f0f3fa', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:((item.value/max)*100)+'%', height:'100%', background:item.color, borderRadius:3, transition:'width 0.6s' }} />
            </div>
            <span style={{ fontSize:11, color:'#9ca3af', width:24, textAlign:'right', flexShrink:0 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CandidatesCard({ candidates }) {
  if (!candidates?.length) {
    return (
      <Card title="Candidatos recentes">
        <Empty icon="👥" text="Nenhum candidato ainda. Publique vagas para receber candidaturas." />
      </Card>
    );
  }

  return (
    <Card title="Candidatos recentes">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {candidates.slice(0, 5).map((c, i) => {
          const initials = (c.nome || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const pillCls  = STATUS_PILL[c.status] || 'pill-cyan';
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,' + AVATAR_COLORS[i%4] + ',#2d52c4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:'#fff',
              }}>{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#1a1f36', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</p>
                <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>{c.cargo || c.vaga_titulo || '-'}</p>
              </div>
              <Pill cls={pillCls}>{PILL_LABEL[pillCls] || c.status || 'Novo'}</Pill>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function QuickActions({ onNavigate }) {
  const actions = [
    { label:'Nova vaga',         icon:'+', bg:'rgba(26,58,143,0.1)',   color:'#1a3a8f', tab:'vagas'   },
    { label:'Banco de Talentos', icon:'*', bg:'rgba(16,185,129,0.12)', color:'#10b981', tab:'talent'  },
    { label:'Copiloto IA',       icon:'~', bg:'rgba(224,123,0,0.12)',  color:'#e07b00', tab:'ai'      },
    { label:'Ver relatorios',    icon:'>', bg:'rgba(45,82,196,0.12)',  color:'#2d52c4', tab:'reports' },
  ];
  return (
    <Card title="Acoes rapidas">
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {actions.map((a, i) => (
          <button key={i} onClick={() => onNavigate && onNavigate(a.tab)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9, border:'1px solid #e2e8f4', background:'#fff', cursor:'pointer', fontSize:13, color:'#1a1f36', fontWeight:500, textAlign:'left', fontFamily:'inherit', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#f0f3fa'; e.currentTarget.style.borderColor='#1a3a8f'; e.currentTarget.style.color='#1a3a8f'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e2e8f4'; e.currentTarget.style.color='#1a1f36'; }}>
            <span style={{ width:24, height:24, borderRadius:6, background:a.bg, color:a.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, fontWeight:700 }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function AlertasCard({ alertas }) {
  if (!alertas?.length) return null;
  return (
    <Card title="Alertas" badge={String(alertas.length)} badgeColor="orange">
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {alertas.slice(0, 4).map((a, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(224,123,0,0.07)', borderRadius:8, border:'1px solid rgba(224,123,0,0.15)' }}>
            <span style={{ fontSize:13, flexShrink:0 }}>⚠</span>
            <span style={{ fontSize:12, color:'#1a1f36', lineHeight:1.4 }}>{a.msg || a.mensagem || a.message || a}</span>
            {a.time && <span style={{ marginLeft:'auto', fontSize:10, color:'#9ca3af', flexShrink:0 }}>{a.time}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function PanelOverview({ kpis, candidates, evolucao, funil, alertas, onNavigate }) {
  if (!kpis) return <Spinner />;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,minmax(0,1fr))', gap:10 }}>
        {kpis.map((k, i) => (
          <KpiCard key={i} icon={KPI_META[i]?.icon||'?'} label={k.label} value={k.value} delta={k.delta} deltaUp={k.up??k.deltaUp??true} color={KPI_META[i]?.color||'#1a3a8f'} delay={i*0.05} />
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12 }}>
        <BarChart evolucao={evolucao} />
        <FunnelCard funil={funil} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <CandidatesCard candidates={candidates} />
        <QuickActions onNavigate={onNavigate} />
      </div>
      <AlertasCard alertas={alertas} />
    </div>
  );
}
