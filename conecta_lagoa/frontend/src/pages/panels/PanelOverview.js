// src/pages/panels/PanelOverview.jsx
import { Card, KpiCard, Spinner, Pill, V, PILL_LABEL } from './shared';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const KPI_META = [
  { icon: '📋', color: '#1a3a8f' },
  { icon: '👥', color: '#2d52c4' },
  { icon: '✨', color: '#10b981' },
  { icon: '⏱',  color: '#e07b00' },
  { icon: '💰', color: '#10b981' },
];

function BarChart({ evolucao }) {
  const data = evolucao?.length ? evolucao.slice(0, 6) : [
    { mes: 'Jan', candidatos: 30, contratacoes: 12 },
    { mes: 'Fev', candidatos: 45, contratacoes: 18 },
    { mes: 'Mar', candidatos: 38, contratacoes: 15 },
    { mes: 'Abr', candidatos: 55, contratacoes: 22 },
    { mes: 'Mai', candidatos: 62, contratacoes: 28 },
    { mes: 'Jun', candidatos: 70, contratacoes: 30 },
  ];
  const maxVal = Math.max(...data.flatMap(d => [d.candidatos || 0, d.contratacoes || 0]), 1);

  return (
    <Card title="Evolução mensal" sub="Candidatos vs contratações" badge={String(new Date().getFullYear())} badgeColor="blue">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
        {data.map((d, i) => {
          const cH  = Math.max(((d.candidatos   || 0) / maxVal) * 110, 4);
          const ctH = Math.max(((d.contratacoes || 0) / maxVal) * 110, 4);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: 110 }}>
              <div style={{ flex: 1, height: cH,  background: '#1a3a8f', borderRadius: '3px 3px 0 0' }} />
              <div style={{ flex: 1, height: ctH, background: '#e07b00', borderRadius: '3px 3px 0 0' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>{d.mes || MONTHS[i]}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {[['Candidatos', '#1a3a8f'], ['Contratações', '#e07b00']].map(([lbl, color]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{lbl}
          </div>
        ))}
      </div>
    </Card>
  );
}

function FunnelCard({ funil }) {
  const defaults = [
    { label: 'Recebidos',   value: 84, color: '#1a3a8f' },
    { label: 'Triados',     value: 55, color: '#2d52c4' },
    { label: 'Entrevistas', value: 32, color: '#e07b00' },
    { label: 'Propostas',   value: 15, color: '#e07b00' },
    { label: 'Contratados', value: 8,  color: '#10b981' },
  ];
  const items = funil?.length
    ? funil.map(f => ({ label: f.etapa || f.label, value: f.total || f.value || 0, color: f.color || '#1a3a8f' }))
    : defaults;
  const max = Math.max(...items.map(i => i.value), 1);

  return (
    <Card title="Funil geral" sub="Pipeline atual" badge="Ao vivo" badgeColor="green">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#6b7280', width: 90, flexShrink: 0 }}>{item.label}</span>
            <div style={{ flex: 1, height: 6, background: '#f0f3fa', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 12, color: '#9ca3af', width: 28, textAlign: 'right', flexShrink: 0 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const AVATAR_COLORS = ['#1a3a8f', '#2d52c4', '#10b981', '#e07b00'];

function CandidatesCard({ candidates }) {
  const defaults = [
    { nome: 'Ana Beatriz',    cargo: 'Dev Frontend', status: 'pill-cyan'   },
    { nome: 'Marcos Costa',   cargo: 'UX Designer',  status: 'pill-green'  },
    { nome: 'Larissa Santos', cargo: 'Analista RH',  status: 'pill-orange' },
    { nome: 'Paulo Ramos',    cargo: 'Backend Node', status: 'pill-cyan'   },
  ];
  const list = candidates?.length ? candidates.slice(0, 4) : defaults;

  return (
    <Card title="Candidatos recentes">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((c, i) => {
          const initials = (c.nome || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const pillCls  = c.status || 'pill-cyan';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${AVATAR_COLORS[i % 4]}, #2d52c4)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1f36', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{c.cargo || c.titulo || '—'}</p>
              </div>
              <Pill cls={pillCls}>{PILL_LABEL[pillCls] || 'Novo'}</Pill>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Nova vaga',           icon: '＋', bg: 'rgba(26,58,143,0.1)',   color: '#1a3a8f' },
    { label: 'Importar currículos', icon: '↑',  bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    { label: 'Copiloto IA',         icon: '✦',  bg: 'rgba(224,123,0,0.12)',  color: '#e07b00' },
    { label: 'Ver relatórios',      icon: '↗',  bg: 'rgba(45,82,196,0.12)',  color: '#2d52c4' },
  ];
  return (
    <Card title="Ações rápidas">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((a, i) => (
          <button key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid #e2e8f4', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#1a1f36', fontWeight: 500, transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f3fa'; e.currentTarget.style.borderColor = '#1a3a8f'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff';    e.currentTarget.style.borderColor = '#e2e8f4'; }}
          >
            <span style={{ width: 26, height: 26, borderRadius: 7, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{a.icon}</span>
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
    <Card title="Alertas" badge={`${alertas.length}`} badgeColor="orange">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alertas.slice(0, 3).map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(224,123,0,0.08)', borderRadius: 8, border: '1px solid rgba(224,123,0,0.2)' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 12, color: '#1a1f36' }}>{a.mensagem || a.message || a}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function PanelOverview({ kpis, candidates, evolucao, funil, alertas }) {
  if (!kpis) return <Spinner />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
        {kpis.map((k, i) => (
          <KpiCard key={i} icon={KPI_META[i]?.icon || '📊'} label={k.label} value={k.value} delta={k.delta} deltaUp={k.up ?? k.deltaUp ?? true} color={KPI_META[i]?.color || '#1a3a8f'} delay={i * 0.05} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <BarChart evolucao={evolucao} />
        <FunnelCard funil={funil} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <CandidatesCard candidates={candidates} />
        <QuickActions />
      </div>
      <AlertasCard alertas={alertas} />
    </div>
  );
}
