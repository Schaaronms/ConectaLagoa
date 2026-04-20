import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isCandidato, isEmpresa } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha menu mobile ao navegar
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const getInitials = (nome) => {
    if (!nome) return '?';
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .hdr-root {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226,232,244,0.8);
          transition: box-shadow 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .hdr-root.scrolled {
          box-shadow: 0 4px 32px rgba(26,58,143,0.10);
        }

        /* Faixa laranja fina no topo */
        .hdr-topbar {
          height: 3px;
          background: linear-gradient(90deg, #1a3a8f 0%, #2d52c4 40%, #e07b00 100%);
        }

        .hdr-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        /* ── LOGO ── */
        .hdr-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .hdr-logo-mark {
          position: relative;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
        }
        .hdr-logo-mark svg {
          width: 38px;
          height: 38px;
        }
        .hdr-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .hdr-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #1a3a8f;
          letter-spacing: -0.3px;
        }
        .hdr-logo-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 3.5px;
          color: #e07b00;
          text-transform: uppercase;
          margin-top: 1px;
        }

        /* ── NAV LINKS ── */
        .hdr-nav {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
        }
        .hdr-nav-link {
          position: relative;
          color: #4b5563;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .hdr-nav-link:hover {
          color: #1a3a8f;
          background: rgba(26,58,143,0.06);
        }
        .hdr-nav-link.active {
          color: #1a3a8f;
          font-weight: 600;
        }
        .hdr-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 14px;
          right: 14px;
          height: 2px;
          background: #e07b00;
          border-radius: 2px;
        }

        /* ── AÇÕES DIREITA ── */
        .hdr-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* Botão Entrar */
        .hdr-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 8px;
          border: 1.5px solid #d1d9f0;
          background: transparent;
          color: #1a3a8f;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .hdr-btn-ghost:hover {
          border-color: #1a3a8f;
          background: rgba(26,58,143,0.05);
        }

        /* Botão Cadastrar */
        .hdr-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 20px;
          border-radius: 8px;
          border: none;
          background: #1a3a8f;
          color: white;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          box-shadow: 0 2px 12px rgba(26,58,143,0.25);
        }
        .hdr-btn-primary:hover {
          background: #0f2460;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(26,58,143,0.35);
        }

        /* ── USER CHIP ── */
        .hdr-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 14px 5px 5px;
          border-radius: 50px;
          border: 1.5px solid #e2e8f4;
          background: #f8fafd;
          cursor: default;
          transition: border-color 0.2s;
        }
        .hdr-user:hover { border-color: #b8c8e8; }
        .hdr-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a3a8f, #2d52c4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
        }
        .hdr-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #1a1f36;
          max-width: 130px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hdr-divider {
          width: 1px;
          height: 20px;
          background: #e2e8f4;
          flex-shrink: 0;
        }

        /* Botão Sair */
        .hdr-btn-sair {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1.5px solid #fee2e2;
          background: #fff5f5;
          color: #dc2626;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .hdr-btn-sair:hover {
          background: #fecaca;
          border-color: #fca5a5;
        }

        /* ── MOBILE TOGGLE ── */
        .hdr-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .hdr-hamburger:hover { background: rgba(26,58,143,0.06); }
        .hdr-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #1a3a8f;
          border-radius: 2px;
          transition: all 0.3s;
        }

        /* ── MOBILE MENU ── */
        .hdr-mobile {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 12px 20px 16px;
          border-top: 1px solid #e2e8f4;
          background: white;
          animation: mobileSlide 0.2s ease;
        }
        @keyframes mobileSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hdr-mobile-link {
          display: block;
          padding: 10px 14px;
          border-radius: 8px;
          color: #4b5563;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
        }
        .hdr-mobile-link:hover, .hdr-mobile-link.active {
          background: rgba(26,58,143,0.06);
          color: #1a3a8f;
        }
        .hdr-mobile-divider {
          height: 1px;
          background: #e2e8f4;
          margin: 8px 0;
        }

        /* ── RESPONSIVO ── */
        @media (max-width: 820px) {
          .hdr-nav { display: none; }
          .hdr-hamburger { display: flex; }
          .hdr-btn-ghost, .hdr-btn-primary { display: none; }
          .hdr-mobile.open { display: flex; }
          .hdr-inner { padding: 0 20px; }
        }
        @media (max-width: 520px) {
          .hdr-user-name { display: none; }
        }
      `}</style>

      <header className={`hdr-root${scrolled ? ' scrolled' : ''}`}>
        <div className="hdr-topbar"/>

        <div className="hdr-inner">

          {/* ── LOGO ── */}
          <Link to="/" className="hdr-logo">
            <div className="hdr-logo-mark">
              {/* Ícone SVG com mapa + conexão */}
              <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="38" rx="10" fill="#1a3a8f"/>
                {/* Linhas de conexão */}
                <circle cx="10" cy="19" r="3" fill="#e07b00"/>
                <circle cx="28" cy="19" r="3" fill="#e07b00"/>
                <circle cx="19" cy="11" r="3" fill="white" opacity="0.9"/>
                <circle cx="19" cy="27" r="3" fill="white" opacity="0.9"/>
                <line x1="10" y1="19" x2="28" y2="19" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <line x1="19" y1="11" x2="19" y2="27" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <line x1="10" y1="19" x2="19" y2="11" stroke="#e07b00" strokeWidth="1.5" strokeOpacity="0.7"/>
                <line x1="19" y1="11" x2="28" y2="19" stroke="#e07b00" strokeWidth="1.5" strokeOpacity="0.7"/>
                <line x1="28" y1="19" x2="19" y2="27" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <line x1="19" y1="27" x2="10" y2="19" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="hdr-logo-text">
              <span className="hdr-logo-name">Conecta</span>
              <span className="hdr-logo-sub">Lagoa</span>
            </div>
          </Link>

          {/* ── NAV CENTRAL ── */}
          <nav className="hdr-nav">
            {!user ? (
              <>
                <Link to="/sobre"  className={`hdr-nav-link${isActive('/sobre') ?' active':''}`}>Sobre</Link>
                <Link to="/vagas"  className={`hdr-nav-link${isActive('/vagas') ?' active':''}`}>Vagas</Link>
                <Link to="/empresa/registro" className={`hdr-nav-link${isActive('/empresa/registro')?' active':''}`}>Empresas</Link>
                <Link to="/blog"   className={`hdr-nav-link${isActive('/blog')  ?' active':''}`}>Blog</Link>
              </>
            ) : isCandidato() ? (
              <>
                <Link to="/candidato/dashboard" className={`hdr-nav-link${isActive('/candidato/dashboard')?' active':''}`}>Meu Perfil</Link>
                <Link to="/candidato/editar"    className={`hdr-nav-link${isActive('/candidato/editar')   ?' active':''}`}>Editar Perfil</Link>
                <Link to="/vagas"               className={`hdr-nav-link${isActive('/vagas')              ?' active':''}`}>Vagas</Link>
              </>
            ) : isEmpresa() ? (
              <>
                <Link to="/empresa/dashboard"   className={`hdr-nav-link${isActive('/empresa/dashboard') ?' active':''}`}>Dashboard</Link>
                <Link to="/vagas"               className={`hdr-nav-link${isActive('/vagas') ?' active':''}`}>Vagas Públicas</Link>
                <Link to="/sobre"               className={`hdr-nav-link${isActive('/sobre') ?' active':''}`}>Sobre</Link>
              </>
            ) : null}
          </nav>

          {/* ── AÇÕES DIREITA ── */}
          <div className="hdr-actions">
            {!user ? (
              <>
                <Link to="/login"    className="hdr-btn-ghost">Entrar</Link>
                <Link to="/registro" className="hdr-btn-primary">
                  Cadastrar
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </>
            ) : (
              <>
                {/* Chip do usuário */}
                <div className="hdr-user">
                  <div className="hdr-avatar">{getInitials(user.nome)}</div>
                  <span className="hdr-user-name">{user.nome}</span>
                </div>
                <div className="hdr-divider"/>
                <button onClick={handleLogout} className="hdr-btn-sair">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sair
                </button>
              </>
            )}

            {/* Hamburger mobile */}
            <button className="hdr-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span style={menuOpen ? { transform:'rotate(45deg) translate(5px,5px)' } : {}}/>
              <span style={menuOpen ? { opacity:0, transform:'translateX(-8px)' } : {}}/>
              <span style={menuOpen ? { transform:'rotate(-45deg) translate(5px,-5px)' } : {}}/>
            </button>
          </div>
        </div>

        {/* ── MENU MOBILE ── */}
        <div className={`hdr-mobile${menuOpen?' open':''}`}>
          {!user ? (
            <>
              <Link to="/sobre"    className={`hdr-mobile-link${isActive('/sobre')   ?' active':''}`}>Sobre</Link>
              <Link to="/vagas"    className={`hdr-mobile-link${isActive('/vagas')   ?' active':''}`}>Vagas</Link>
              <Link to="/empresa/registro" className={`hdr-mobile-link${isActive('/empresa/registro')?' active':''}`}>Empresas</Link>
              <Link to="/blog"     className={`hdr-mobile-link${isActive('/blog')    ?' active':''}`}>Blog</Link>
              <div className="hdr-mobile-divider"/>
              <Link to="/login"    className="hdr-mobile-link">Entrar</Link>
              <Link to="/registro" className="hdr-btn-primary" style={{ justifyContent:'center', marginTop:4 }}>Cadastrar</Link>
            </>
          ) : isCandidato() ? (
            <>
              <Link to="/candidato/dashboard" className="hdr-mobile-link">Meu Perfil</Link>
              <Link to="/candidato/editar"    className="hdr-mobile-link">Editar Perfil</Link>
              <Link to="/vagas"               className="hdr-mobile-link">Vagas</Link>
              <div className="hdr-mobile-divider"/>
              <button onClick={handleLogout} className="hdr-btn-sair" style={{ width:'100%', justifyContent:'center' }}>Sair</button>
            </>
          ) : isEmpresa() ? (
            <>
              <Link to="/empresa/dashboard"  className="hdr-mobile-link">Dashboard</Link>
              <Link to="/vagas" className="hdr-mobile-link">Vagas Públicas</Link>
              <Link to="/sobre"  className="hdr-mobile-link">Sobre</Link>
              <div className="hdr-mobile-divider"/>
              <button onClick={handleLogout} className="hdr-btn-sair" style={{ width:'100%', justifyContent:'center' }}>Sair</button>
            </>
          ) : null}
        </div>
      </header>
    </>
  );
};

export default Header;