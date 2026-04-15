import { useState, useEffect, useRef } from 'react';
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

// ── Painel de Configurações da Empresa ───────────────────────────
function PanelConfig({ user }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]         = useState({ nome: '', cnpj: '', telefone: '', cidade: '', estado: '', descricao: '' });
  const [logoUrl, setLogoUrl]   = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState({ msg: '', ok: true });
  const fileRef                 = useRef(null);

  const apiUrl = (process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api')
    .replace('/api', '');

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3500);
  };

  // Carrega perfil real da empresa
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/empresa/meu-perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const e = data.empresa || data.data || data;
          setForm({
            nome:      e.nome      || user?.nome || '',
            cnpj:      e.cnpj      || '',
            telefone:  e.telefone  || '',
            cidade:    e.cidade    || '',
            estado:    e.estado    || '',
            descricao: e.descricao || '',
          });
          if (e.logo_url) setLogoUrl(e.logo_url);
        }
      } catch (err) {
        console.error('[config] Erro ao carregar perfil:', err);
        setForm(f => ({ ...f, nome: user?.nome || '' }));
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Seleciona arquivo de logo
  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Apenas imagens (JPG, PNG, WebP)', false); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast('Imagem deve ter no máximo 5 MB', false); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Salva tudo: primeiro faz upload do logo (se mudou), depois salva dados
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      // 1. Upload do logo (se um novo arquivo foi selecionado)
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        const logoRes = await fetch(`${BASE_URL}/empresa/logo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          setLogoUrl(logoData.logo_url || logoData.url || null);
          setLogoFile(null);
          setLogoPreview(null);
        } else {
          showToast('Erro ao salvar o logo. Verifique o formato.', false);
          setSaving(false);
          return;
        }
      }

      // 2. Salva os dados textuais via PUT /empresa/perfil
      const perfRes = await fetch(`${BASE_URL}/empresa/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (perfRes.ok) {
        showToast('✓ Perfil atualizado com sucesso!', true);
      } else {
        const err = await perfRes.json().catch(() => ({}));
        showToast(err.message || 'Erro ao salvar dados', false);
      }
    } catch (err) {
      showToast('Erro de conexão', false);
    } finally {
      setSaving(false);
    }
  };

  const s = {
    card:  { background: '#fff', borderRadius: 14, padding: '22px 24px', border: '1px solid #E4E8F0', marginBottom: 16 },
    title: { fontSize: 13, fontWeight: 700, color: '#1A1D2E', marginBottom: 18, borderBottom: '1px solid #F0F3FA', paddingBottom: 10 },
    label: { fontSize: 11, fontWeight: 600, color: '#8A93B2', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 },
    input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E4E8F0', fontSize: 13, color: '#1A1D2E', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' },
    row2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
    row3:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 },
    btn:   (bg, color, border) => ({ padding: '9px 22px', borderRadius: 8, border: border || 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', background: bg, color }),
  };

  const logoSrc = logoPreview || (logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${apiUrl}${logoUrl}`) : null);
  const initials = (form.nome || user?.nome || 'CL').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (loadingData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#6B7280', gap: 10 }}>
      <div style={{ width: 24, height: 24, border: '2px solid #E4E8F0', borderTop: '2px solid #1A56DB', borderRadius: '50%', animation: 'clSpin 0.8s linear infinite' }} />
      Carregando perfil...
    </div>
  );

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Toast */}
      {toast.msg && (
        <div style={{ marginBottom: 16, padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: toast.ok ? '#DCFCE7' : '#FEE2E2', color: toast.ok ? '#15803D' : '#DC2626', border: `1px solid ${toast.ok ? '#86EFAC' : '#FECACA'}` }}>
          {toast.msg}
        </div>
      )}

      {/* Logo + Identidade */}
      <div style={s.card}>
        <div style={s.title}>🖼️ Logo da Empresa</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>

          {/* Preview do logo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 88, height: 88, borderRadius: 16, border: '2px dashed #E4E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF', cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}>
              {logoSrc
                ? <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A56DB, #2d52c4)', color: '#fff', fontSize: 22, fontWeight: 700 }}>{initials}</div>
              }
            </div>
            {/* Botão de câmera */}
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 6px rgba(26,86,219,0.4)' }}
              onClick={() => fileRef.current?.click()}>
              📷
            </div>
          </div>

          {/* Info e botão */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1D2E', marginBottom: 4 }}>
              {logoFile ? `📎 ${logoFile.name}` : logoSrc ? 'Logo atual' : 'Nenhum logo definido'}
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 1.5 }}>
              JPG, PNG ou WebP · Máximo 5 MB<br/>Recomendado: 200×200px ou maior
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={s.btn('#1A56DB', '#fff')} onClick={() => fileRef.current?.click()}>
                {logoFile ? '↺ Trocar arquivo' : '⬆ Carregar logo'}
              </button>
              {(logoFile || logoSrc) && (
                <button style={s.btn('#F8FAFF', '#DC2626', '1px solid #FECACA')}
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null); }}>
                  Remover
                </button>
              )}
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoSelect} />
        </div>
      </div>

      {/* Dados da empresa */}
      <div style={s.card}>
        <div style={s.title}>🏢 Dados da Empresa</div>

        <div style={s.row2}>
          <div>
            <label style={s.label}>Nome / Razão Social</label>
            <input style={s.input} value={form.nome} onChange={set('nome')}
              onFocus={e => e.target.style.borderColor='#1A56DB'} onBlur={e => e.target.style.borderColor='#E4E8F0'} />
          </div>
          <div>
            <label style={s.label}>CNPJ</label>
            <input style={s.input} value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0000-00"
              onFocus={e => e.target.style.borderColor='#1A56DB'} onBlur={e => e.target.style.borderColor='#E4E8F0'} />
          </div>
        </div>

        <div style={s.row3}>
          <div>
            <label style={s.label}>Telefone</label>
            <input style={s.input} value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000"
              onFocus={e => e.target.style.borderColor='#1A56DB'} onBlur={e => e.target.style.borderColor='#E4E8F0'} />
          </div>
          <div>
            <label style={s.label}>Cidade</label>
            <input style={s.input} value={form.cidade} onChange={set('cidade')}
              onFocus={e => e.target.style.borderColor='#1A56DB'} onBlur={e => e.target.style.borderColor='#E4E8F0'} />
          </div>
          <div>
            <label style={s.label}>Estado (UF)</label>
            <input style={s.input} value={form.estado} onChange={set('estado')} placeholder="SP"
              onFocus={e => e.target.style.borderColor='#1A56DB'} onBlur={e => e.target.style.borderColor='#E4E8F0'} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Descrição / Sobre a empresa</label>
          <textarea value={form.descricao} onChange={set('descricao')} rows={4}
            placeholder="Conte sobre sua empresa, cultura, valores..."
            style={{ ...s.input, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor='#1A56DB'} onBlur={e => e.target.style.borderColor='#E4E8F0'} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ ...s.btn('#1A56DB', '#fff'), opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
          </button>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            {logoFile ? '📎 Novo logo será enviado junto' : ''}
          </span>
        </div>
      </div>

      {/* Segurança */}
      <div style={s.card}>
        <div style={s.title}>🔒 Segurança</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.6 }}>
          Para alterar sua senha, clique abaixo. Você receberá um e-mail com as instruções de redefinição.
        </p>
        <button style={s.btn('#F0F3FA', '#1A3A8F', '1px solid #E4E8F0')}
          onClick={() => navigate('/empresa/esqueceu-senha')}>
          🔑 Redefinir Senha por E-mail
        </button>
      </div>

      {/* Sessão */}
      <div style={s.card}>
        <div style={s.title}>🚪 Sessão</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Encerrar sessão atual neste dispositivo.</p>
        <button style={s.btn('#FEE2E2', '#DC2626', '1px solid #FECACA')}
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
      case 'overview':      return <PanelOverview kpis={kpis} candidates={candidates} evolucao={evolucao} funil={funil} alertas={alertas} onNavigate={setActiveTab} />;
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