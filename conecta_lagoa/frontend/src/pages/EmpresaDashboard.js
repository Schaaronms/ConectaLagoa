import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PanelOverview from './panels/PanelOverview';
import { BASE_URL } from './panels/shared';

const sidebarItems = [
  { id: 'overview',       label: 'Painel',            icon: '▪' },
  { id: 'vagas',          label: 'Vagas',              icon: '▪' },
  { id: 'talent',         label: 'Banco de Talentos',  icon: '▪' },
  { id: 'funnel',         label: 'Funil CRM',          icon: '▪' },
  { id: 'agenda',         label: 'Agenda',             icon: '▪' },
  { id: 'ai',             label: 'Copiloto IA',        icon: '▪' },
  { id: 'reports',        label: 'Relatórios',         icon: '▪' },
  { id: 'colaboradores',  label: 'Colaboradores',      icon: '▪' },
];

export default function EmpresaDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [evolucao, setEvolucao] = useState([]);
  const [funil, setFunil] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      try {
        const get = async (path) => {
          const res = await fetch(`${BASE_URL}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return res.ok ? res.json() : null;
        };

        const [resumo, cands, evolucaoData, funilData, alertasData] = await Promise.all([
          get('/dashboard/resumo'),
          get('/dashboard/candidatos-recentes'),
          get('/dashboard/evolucao-mensal'),
          get('/dashboard/funil'),
          get('/dashboard/alertas'),
        ]);

        const r = resumo?.data || resumo || {};

        setKpis([
          { label: 'Vagas abertas',           value: r.vagas_ativas || 0,            delta: `+${r.vagas_semana || 0} esta semana`,    up: true  },
          { label: 'Candidatos no pipeline',  value: r.candidaturas || 0,            delta: `+${r.candidaturas_hoje || 0} hoje`,       up: true  },
          { label: 'Taxa de matching IA',     value: `${r.taxa_conversao || 0}%`,    delta: `${r.taxa_variacao || 0}% vs mês ant.`,   up: (r.taxa_variacao || 0) >= 0 },
          { label: 'Tempo médio contratação', value: `${r.tempo_medio || '—'} dias`, delta: 'vs mês ant.',                            up: false },
          { label: 'Custo por contratação',   value: `R$ ${r.custo_medio || '—'}`,   delta: 'vs mês ant.',                            up: false },
        ]);

        if (cands)       setCandidates(cands.data || cands);
        if (evolucaoData) setEvolucao(evolucaoData);
        if (funilData)   setFunil(funilData);
        if (alertasData) setAlertas(alertasData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const initials = user?.nome
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const firstName = user?.nome?.split(' ')[0] || 'usuário';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F5F6FA', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid #EAECF0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #EAECF0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: '#1A56DB', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: -0.5,
          }}>CL</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Conecta Lagoa</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Recrutamento Local</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sidebarItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left', width: '100%',
                  background: active ? '#EFF4FF' : 'transparent',
                  color: active ? '#1A56DB' : '#6B7280',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: active ? '#1A56DB' : '#D1D5DB',
                  transition: 'background 0.15s',
                }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #EAECF0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#DBEAFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: '#1E40AF', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nome || 'Empresa'}
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Recrutador</p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          height: 60, background: '#fff', borderBottom: '1px solid #EAECF0',
          padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
              Bom dia, {firstName}
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, textTransform: 'capitalize' }}>{today}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 12, color: '#6B7280', background: '#F9FAFB',
              border: '1px solid #E5E7EB', padding: '5px 12px', borderRadius: 8,
            }}>Últimos 30 dias ▾</span>

            <button style={{
              background: 'transparent', border: '1px solid #E5E7EB', color: '#374151',
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500,
            }}>
              🔔 Lembrete
            </button>

            <button style={{
              background: '#1A56DB', border: 'none', color: '#fff',
              padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500,
            }}>
              + Nova Vaga
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid #E5E7EB',
                borderTop: '3px solid #1A56DB', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : activeTab === 'overview' ? (
            <PanelOverview
              kpis={kpis}
              candidates={candidates}
              evolucao={evolucao}
              funil={funil}
              alertas={alertas}
            />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '50vh', gap: 8,
            }}>
              <p style={{ fontSize: 32 }}>🚧</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#374151' }}>Em breve</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                {sidebarItems.find(i => i.id === activeTab)?.label} estará disponível em breve
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
