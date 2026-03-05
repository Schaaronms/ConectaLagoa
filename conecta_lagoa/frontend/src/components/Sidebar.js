// ============================================================
// Sidebar.js — Navegação lateral do Conecta Lagoa
// Cores: azul #1a3a8f · laranja #e07b00 · branco
// ============================================================
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CL_BLUE   = '#1a3a8f';
const CL_ORANGE = '#e07b00';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',        icon: IconGrid },
  { id: 'vagas',      label: 'Vagas',             icon: IconBriefcase },
  { id: 'candidatos', label: 'Candidatos',        icon: IconPeople },
  { id: 'funil',      label: 'Funil CRM',         icon: IconFunnel },
  { id: 'talentos',   label: 'Banco de Talentos', icon: IconStar },
  { id: 'agenda',     label: 'Agenda',            icon: IconCalendar },
  { id: 'relatorios', label: 'Relatórios',        icon: IconChart },
  { id: 'perfil',     label: 'Perfil Empresa',    icon: IconBuilding },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: expanded ? 220 : 64,
        background: CL_BLUE,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
        zIndex: 200,
        overflow: 'hidden',
        boxShadow: '4px 0 24px rgba(26,58,143,0.25)',
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        minHeight: 64, flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: CL_ORANGE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 14, color: 'white', fontFamily: 'Outfit, sans-serif',
        }}>CL</div>
        <span style={{
          color: 'white', fontFamily: 'Outfit, sans-serif',
          fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap',
          opacity: expanded ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          Conecta Lagoa
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px', border: 'none', cursor: 'pointer',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: active ? 'white' : 'rgba(255,255,255,0.65)',
              textAlign: 'left', transition: 'all 0.15s',
              borderLeft: active ? `3px solid ${CL_ORANGE}` : '3px solid transparent',
              position: 'relative',
            }}
            onMouseEnter={e => { if(!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { if(!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif',
                opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
              }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: CL_ORANGE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white',
        }}>
          {user?.nome?.slice(0,2).toUpperCase() || 'CL'}
        </div>
        <div style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.15s', flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.nome || 'Empresa'}
          </div>
          <button onClick={logout} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'rgba(255,255,255,0.5)', padding: 0,
            fontFamily: 'DM Sans, sans-serif',
          }}>Sair</button>
        </div>
      </div>
    </aside>
  );
}

// ── Ícones SVG inline ─────────────────────────────────────────
function Svg({ size = 20, children, ...p }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>;
}
function IconGrid({ size })     { return <Svg size={size}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Svg>; }
function IconBriefcase({ size }){ return <Svg size={size}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></Svg>; }
function IconPeople({ size })   { return <Svg size={size}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></Svg>; }
function IconFunnel({ size })   { return <Svg size={size}><path d="M3 4h18l-7 8v7l-4-2V12L3 4z"/></Svg>; }
function IconStar({ size })     { return <Svg size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>; }
function IconCalendar({ size }) { return <Svg size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></Svg>; }
function IconChart({ size })    { return <Svg size={size}><path d="M18 20V10M12 20V4M6 20v-6"/></Svg>; }
function IconBuilding({ size }) { return <Svg size={size}><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 21V9h6v12M9 9h6"/></Svg>; }
