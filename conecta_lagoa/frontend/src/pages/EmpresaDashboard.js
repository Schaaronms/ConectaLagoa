import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PanelOverview     from './panels/PanelOverview';
import PanelVagas        from './panels/PanelVagas';
import PanelTalent       from './panels/PanelTalent';
import PanelFunil        from './PanelFunil';
import PanelAgenda       from './PanelAgenda';
import PanelIA           from './panels/PanelAI';
import PanelReports      from './panels/PanelReports';
import PanelColaboradores from './panels/PanelColaboradores';
import PanelIndicadoresRH from './panels/PanelIndicadoresRH';
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
  { id: 'overview',      label: 'Painel',           icon: '🏠' },
  { id: 'vagas',         label: 'Vagas',             icon: '💼' },
  { id: 'talent',        label: 'Banco de Talentos', icon: '🌟' },
  { id: 'funnel',        label: 'Funil CRM',         icon: '📊' },
  { id: 'agenda',        label: 'Agenda',            icon: '📅' },
  { id: 'ai',            label: 'Copiloto IA',       icon: '🤖' },
  { id: 'indicadores',   label: 'Indicadores RH',    icon: '📈' },
  { id: 'colaboradores', label: 'Colaboradores',     icon: '👥' },
  { id: 'reports',       label: 'Relatórios',        icon: '📋' },
  { id: 'config',        label: 'Configurações',     icon: '⚙️' },
];

// ── Painel de Configurações inline ───────────────────────────────
function PanelConfig({ user }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ nome: user?.nome || '', email: user?.email || '', telefone: user?.telefone || '', cidade: user?.cidade || '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const s = {
    card:  { background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E4E8F0', marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 600, color: '#8A93B2', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 },
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E4E8F0', fontSize: 14, color: '#1A1D2E', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    row:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
    title: { fontSize: 15, fontWeight: 700, color: '#1A1D2E', marginBottom: 20, borderBottom: '1px solid #F0F3FA', paddingBottom: 12 },
    btn:   { padding: '10px 24px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/usuarios/dados`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: form.nome, telefone: form.telefone, cidade: form.cidade }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Dados da empresa */}
      <div style={s.card}>
        <div style={s.title}>🏢 Dados da Empresa</div>
        <div style={s.row}>
          <div><label style={s.label}>Nome / Razão Social</label><input style={s.input} value={form.nome} onChange={set('nome')}/></div>
          <div><label style={s.label}>E-mail</label><input style={s.input} value={form.email} onChange={set('email')}/></div>
        </div>
        <div style={s.row}>
          <div><label style={s.label}>Telefone</label><input style={s.input} value={form.telefone} onChange={set('telefone')}/></div>
          <div><label style={s.label}>Cidade</label><input style={s.input} value={form.cidade} onChange={set('cidade')}/></div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <button style={{ ...s.btn, background: '#1A3A8F', color: '#fff' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : '💾 Salvar Alterações'}
          </button>
          {saved && <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>✓ Dados atualizados!</span>}
        </div>
      </div>

      {/* Segurança */}
      <div style={s.card}>
        <div style={s.title}>🔒 Segurança</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Para alterar sua senha, clique no botão abaixo. Você receberá um e-mail com as instruções.</p>
        <button style={{ ...s.btn, background: '#F0F3FA', color: '#1A3A8F', border: '1px solid #E4E8F0' }}
          onClick={() => navigate('/empresa/esqueceu-senha')}>
          🔑 Redefinir Senha
        </button>
      </div>

      {/* Conta */}
      <div style={s.card}>
        <div style={s.title}>🚪 Sessão</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Encerrar sessão atual neste dispositivo.</p>
        <button style={{ ...s.btn, background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
          onClick={() => { logout(); navigate('/'); }}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}

export default function EmpresaDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [evolucao, setEvolucao] = useState([]);
  const [funil, setFunil] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const activeItem = sidebarItems.find(i => i.id === activeTab);

  const renderPanel = () => {
    if (loading && activeTab === 'overview') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 38, height: 38, border: `3px solid #E5E7EB`, borderTop: `3px solid ${CL.blue}`, borderRadius: '50%', animation: 'clSpin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: CL.muted }}>Carregando dados...</p>
          <style>{`@keyframes clSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':      return <PanelOverview kpis={kpis} candidates={candidates} evolucao={evolucao} funil={funil} alertas={alertas} />;
      case 'vagas':         return <PanelVagas />;
      case 'talent':        return <PanelTalent />;
      case 'funnel':        return <PanelFunil />;
      case 'agenda':        return <PanelAgenda />;
      case 'ai':            return <PanelIA />;
      case 'indicadores':   return <PanelIndicadoresRH />;
      case 'colaboradores': return <PanelColaboradores />;
      case 'reports':       return <PanelReports />;
      case 'config':        return <PanelConfig user={user} />;
      default:              return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: CL.bg, overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes clSpin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 232, background: '#fff', borderRight: `1px solid ${CL.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${CL.blue}, #2d52c4)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 12px rgba(26,86,219,0.35)' }}>CL</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: CL.text, margin: 0, letterSpacing: '-0.01em' }}>Conecta Lagoa</p>
            <p style={{ fontSize: 10, color: CL.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empresa</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sidebarItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left', width: '100%',
                  background: active ? '#EFF4FF' : 'transparent', color: active ? CL.blue : CL.muted,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.color = '#374151'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = CL.muted; }}}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: CL.blue, flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '10px 10px 14px', borderTop: `1px solid ${CL.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, background: '#F8FAFF', marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${CL.blue}, #2d52c4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: CL.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nome || 'Empresa'}</p>
              <p style={{ fontSize: 10, color: CL.muted, margin: 0 }}>Recrutador</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{ width: '100%', padding: '7px 12px', borderRadius: 8, border: `1px solid ${CL.border}`, background: 'transparent', color: CL.muted, fontSize: 12, cursor: 'pointer', fontWeight: 500, textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = CL.muted; e.currentTarget.style.borderColor = CL.border; }}
          >
            <span>🚪</span> Sair da conta
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 58, background: '#fff', borderBottom: `1px solid ${CL.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: CL.text, margin: 0 }}>
              {activeItem?.icon} {activeItem?.label}
            </p>
            <p style={{ fontSize: 11, color: CL.muted, margin: 0, textTransform: 'capitalize' }}>
              {activeTab === 'overview' ? today : `Bom dia, ${firstName}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setActiveTab('agenda')}
              style={{ background: 'transparent', border: `1px solid ${CL.border}`, color: '#374151', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >📅 Agenda</button>
            <button
              onClick={() => setActiveTab('vagas')}
              style={{ background: CL.blue, border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(26,86,219,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1244C4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = CL.blue; }}
            >+ Nova Vaga</button>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}