// ============================================================
// App.js — Roteamento principal do Conecta Lagoa
// Conecta: Login → Dashboard Empresa → todas as abas
// ============================================================
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import EmpresaDashboard from './pages/EmpresaDashboardvelha';

// ── Páginas stub (implemente conforme necessidade) ─────────────
import LoginPage     from './pages/LoginPage';

// ─────────────────────────────────────────────────────────────
// Shell autenticado — Sidebar + conteúdo
// ─────────────────────────────────────────────────────────────
function AuthenticatedShell() {
  const [page, setPage] = useState('dashboard');

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar activePage={page} onNavigate={setPage} />
      {/* offset pelo sidebar (64px collapsed) */}
      <div style={{ marginLeft:64, flex:1, transition:'margin-left 0.25s' }}>
        {page === 'dashboard'  && <EmpresaDashboard />}
        {page === 'vagas'      && <PlaceholderPage title="Vagas" icon="💼" desc="Gerencie suas vagas abertas, edite descrições e acompanhe candidaturas por vaga." />}
        {page === 'candidatos' && <PlaceholderPage title="Candidatos" icon="👥" desc="Visualize e filtre todos os candidatos que se aplicaram às suas vagas." />}
        {page === 'funil'      && <PlaceholderPage title="Funil CRM" icon="🎯" desc="Pipeline Kanban visual: arraste candidatos entre as etapas do processo seletivo." />}
        {page === 'talentos'   && <PlaceholderPage title="Banco de Talentos" icon="⭐" desc="Busque e filtre candidatos salvos, mesmo após encerrar vagas." />}
        {page === 'agenda'     && <PlaceholderPage title="Agenda" icon="📅" desc="Calendário de entrevistas integrado com lembretes automáticos." />}
        {page === 'relatorios' && <PlaceholderPage title="Relatórios" icon="📈" desc="Relatórios estratégicos: salários, turnover, benchmarks de mercado e mais." />}
        {page === 'perfil'     && <PlaceholderPage title="Perfil da Empresa" icon="🏢" desc="Atualize logo, descrição, localização e dados da sua empresa." />}
      </div>
    </div>
  );
}

// ── Placeholder para páginas ainda não implementadas ──────────
function PlaceholderPage({ title, icon, desc }) {
  return (
    <div style={{ padding:60, textAlign:'center', background:'#f4f6fb', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>{icon}</div>
      <h2 style={{ fontFamily:'Outfit, sans-serif', fontSize:24, fontWeight:700, color:'#1a1f36', marginBottom:10 }}>{title}</h2>
      <p style={{ fontSize:14, color:'#6b7280', maxWidth:400 }}>{desc}</p>
      <p style={{ fontSize:12, color:'#9ca3af', marginTop:20, padding:'8px 16px', background:'#e8ecf4', borderRadius:8 }}>
        🛠 Em desenvolvimento — conecte a API e expanda este componente
      </p>
    </div>
  );
}

// ── Guard de autenticação ─────────────────────────────────────
function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f4f6fb' }}>
      <div style={{ width:36, height:36, border:'3px solid #e8ecf4', borderTop:'3px solid #1a3a8f', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return user ? <AuthenticatedShell /> : <LoginPage />;
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
