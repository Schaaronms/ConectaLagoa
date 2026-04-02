// src/pages/panels/PanelOverview.jsx

const card = {
  background: '#fff',
  border: '1px solid #EAECF0',
  borderRadius: 10,
  padding: '16px 18px',
};

const label = {
  fontSize: 11,
  color: '#9CA3AF',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

function KpiCard({ kpi }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={label}>{kpi.label}</p>
      <p style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.1 }}>
        {kpi.value}
      </p>
      <span style={{
        fontSize: 11,
        color: kpi.up ? '#166534' : '#991B1B',
        background: kpi.up ? '#F0FDF4' : '#FEF2F2',
        padding: '2px 8px',
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 2,
      }}>
        {kpi.up ? '▲' : '▼'} {kpi.delta}
      </span>
    </div>
  );
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function BarChart({ evolucao }) {
  // Usa dados reais se disponível, senão placeholder
  const data = evolucao?.length
    ? evolucao.slice(0, 6)
    : [
        { mes: 'Jan', candidatos: 30, contratacoes: 12 },
        { mes: 'Fev', candidatos: 45, contratacoes: 18 },
        { mes: 'Mar', candidatos: 38, contratacoes: 15 },
        { mes: 'Abr', candidatos: 55, contratacoes: 22 },
        { mes: 'Mai', candidatos: 62, contratacoes: 28 },
        { mes: 'Jun', candidatos: 70, contratacoes: 30 },
      ];

  const maxVal = Math.max(...data.flatMap(d => [d.candidatos || 0, d.contratacoes || 0]), 1);

  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Evolução mensal</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>Candidatos vs contratações</p>
        </div>
        <span style={{
          fontSize: 11, background: '#EFF4FF', color: '#1A56DB',
          padding: '3px 10px', borderRadius: 20, fontWeight: 500,
        }}>
          {new Date().getFullYear()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
        {data.map((d, i) => {
          const cH = Math.max(((d.candidatos || 0) / maxVal) * 100, 4);
          const ctH = Math.max(((d.contratacoes || 0) / maxVal) * 100, 4);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%', height: 100 }}>
                <div style={{ flex: 1, height: `${cH}%`, background: '#1A56DB', borderRadius: '3px 3px 0 0' }} />
                <div style={{ flex: 1, height: `${ctH}%`, background: '#FAC75A', borderRadius: '3px 3px 0 0' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels meses */}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#9CA3AF' }}>
            {d.mes || MONTHS[i]}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#1A56DB' }} />
          Candidatos
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FAC75A' }} />
          Contratações
        </div>
      </div>
    </div>
  );
}

function FunnelCard({ funil }) {
  const defaultFunil = [
    { label: 'Recebidos',   value: 84, color: '#1A56DB' },
    { label: 'Triados',     value: 55, color: '#3B82F6' },
    { label: 'Entrevistas', value: 32, color: '#FAC75A' },
    { label: 'Propostas',   value: 15, color: '#F59E0B' },
    { label: 'Contratados', value: 8,  color: '#22C55E' },
  ];

  const items = funil?.length
    ? funil.map(f => ({ label: f.etapa || f.label, value: f.total || f.value, color: f.color }))
    : defaultFunil;

  const max = Math.max(...items.map(i => i.value), 1);

  return (
    <div style={{ ...card }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Funil geral</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>Pipeline atual</p>
        </div>
        <span style={{
          fontSize: 11, background: '#F0FDF4', color: '#166534',
          padding: '3px 10px', borderRadius: 20, fontWeight: 500,
        }}>
          Ao vivo
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151', width: 90, flexShrink: 0 }}>{item.label}</span>
            <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${(item.value / max) * 100}%`,
                height: '100%',
                background: item.color,
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#6B7280', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  novo:      { bg: '#EFF4FF', text: '#1A56DB', label: 'Novo' },
  triado:    { bg: '#F0FDF4', text: '#166534', label: 'Triado' },
  revisao:   { bg: '#FFFBEB', text: '#92400E', label: 'Revisão' },
  proposta:  { bg: '#FFF7ED', text: '#C2410C', label: 'Proposta' },
  recusado:  { bg: '#FEF2F2', text: '#991B1B', label: 'Recusado' },
};

function CandidatesCard({ candidates }) {
  const defaults = [
    { nome: 'Ana Beatriz',    cargo: 'Dev Frontend',  status: 'novo'   },
    { nome: 'Marcos Costa',   cargo: 'UX Designer',   status: 'triado' },
    { nome: 'Larissa Santos', cargo: 'Analista RH',   status: 'revisao'},
    { nome: 'Paulo Ramos',    cargo: 'Backend Node',  status: 'novo'   },
  ];

  const list = candidates?.length ? candidates.slice(0, 4) : defaults;

  return (
    <div style={{ ...card }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 14px' }}>
        Candidatos recentes
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((c, i) => {
          const initials = (c.nome || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          const s = STATUS_COLORS[c.status] || STATUS_COLORS.novo;
          const colors = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3'];
          const textColors = ['#1E40AF', '#065F46', '#92400E', '#9D174D'];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: colors[i % colors.length],
                color: textColors[i % textColors.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.nome}
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{c.cargo || c.titulo}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 500,
                background: s.bg, color: s.text,
                padding: '2px 8px', borderRadius: 20, flexShrink: 0,
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Nova vaga',          icon: '＋', bg: '#EFF4FF', color: '#1A56DB' },
    { label: 'Importar currículos', icon: '↑', bg: '#F0FDF4', color: '#166534' },
    { label: 'Copiloto IA',        icon: '✦', bg: '#FFFBEB', color: '#92400E' },
    { label: 'Ver relatórios',     icon: '↗', bg: '#F0FDFA', color: '#0F766E' },
  ];

  return (
    <div style={{ ...card }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 14px' }}>
        Ações rápidas
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((a, i) => (
          <button key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8,
            border: '1px solid #EAECF0', background: '#FAFAFA',
            cursor: 'pointer', fontSize: 12, color: '#374151',
            fontWeight: 500, transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = '#FAFAFA'}
          >
            <span style={{
              width: 24, height: 24, borderRadius: 6,
              background: a.bg, color: a.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, flexShrink: 0,
            }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AlertasCard({ alertas }) {
  if (!alertas?.length) return null;
  return (
    <div style={{ ...card, gridColumn: '1 / -1' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>Alertas</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alertas.slice(0, 3).map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', background: '#FFFBEB',
            borderRadius: 8, border: '1px solid #FDE68A',
          }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 12, color: '#374151' }}>{a.mensagem || a.message || a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PanelOverview({ kpis, candidates, evolucao, funil, alertas }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 12,
      }}>
        {kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
        <BarChart evolucao={evolucao} />
        <FunnelCard funil={funil} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <CandidatesCard candidates={candidates} />
        <QuickActions />
      </div>

      {/* Alertas (só aparece se tiver dados) */}
      {alertas?.length > 0 && (
        <AlertasCard alertas={alertas} />
      )}
    </div>
  );
}
