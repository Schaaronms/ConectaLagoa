import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PanelOverview from './panels/PanelOverview';
import { BASE_URL } from './panels/shared';

// Definição da paleta de cores centralizada (Objeto CL)
const CL = {
  blue: '#1A56DB',
  cyan: '#06b6d4',
  purple: '#7c3aed',
  orange: '#f59e0b',
  green: '#10b981',
  text: '#111827',
  muted: '#6B7280',
  muted2: '#9CA3AF',
  border: '#EAECF0',
  surface: '#FFFFFF',
  bg: '#F5F6FA',
};

const sidebarItems = [
  { id: 'overview',       label: 'Painel' },
  { id: 'vagas',          label: 'Vagas' },
  { id: 'talent',         label: 'Banco de Talentos' },
  { id: 'funnel',         label: 'Funil CRM' },
  { id: 'agenda',         label: 'Agenda' },
  { id: 'ai',             label: 'Copiloto IA' },
  { id: 'reports',        label: 'Relatórios' },
  { id: 'colaboradores',  label: 'Colaboradores' },
  { id: 'configurações',  label: '⚙️ Configurações' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca de dados na API
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      try {
        const get = async (path) => {
          const res = await fetch(`${BASE_URL}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return null;
          }
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

        if (cands)        setCandidates(cands.data || cands);
        if (evolucaoData) setEvolucao(evolucaoData);
        if (funilData)    setFunil(funilData);
        if (alertasData)  setAlertas(alertasData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initials = user?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';
  const firstName = user?.nome?.split(' ')[0] || 'Usuário';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', background: CL.bg, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ── Sidebar ── */}
      <aside style={{ width: 220, background: '#fff', borderRight: `1px solid ${CL.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: CL.blue, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>CL</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: CL.text, margin: 0 }}>Conecta Lagoa</p>
            <p style={{ fontSize: 11, color: CL.muted, margin: 0 }}>Recrutamento Local</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sidebarItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: 'none', 
                  cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left', width: '100%',
                  background: active ? '#EFF4FF' : 'transparent', color: active ? CL.blue : CL.muted,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? CL.blue : '#D1D5DB' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#1E40AF' }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: CL.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nome || 'Empresa'}</p>
            <p style={{ fontSize: 11, color: CL.muted, margin: 0 }}>Recrutador</p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Topbar */}
        <div style={{ height: 60, background: '#fff', borderBottom: `1px solid ${CL.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: CL.text, margin: 0 }}>Bom dia, {firstName}</p>
            <p style={{ fontSize: 11, color: CL.muted, margin: 0, textTransform: 'capitalize' }}>{today}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: CL.muted, background: '#F9FAFB', border: `1px solid ${CL.border}`, padding: '5px 12px', borderRadius: 8 }}>Últimos 30 dias ▾</span>
            <button style={{ background: 'transparent', border: `1px solid ${CL.border}`, color: '#374151', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>🔔 Lembrete</button>
            <button style={{ background: CL.blue, border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>+ Nova Vaga</button>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
              <div className="spinner" style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTop: `3px solid ${CL.blue}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : activeTab === 'overview' ? (
            <PanelOverview kpis={kpis} candidates={candidates} evolucao={evolucao} funil={funil} alertas={alertas} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 8 }}>
              <p style={{ fontSize: 32 }}>🚧</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#374151' }}>Em breve</p>
              <p style={{ fontSize: 13, color: CL.muted }}>{sidebarItems.find(i => i.id === activeTab)?.label} estará disponível em breve</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}