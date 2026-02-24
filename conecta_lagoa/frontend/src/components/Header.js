import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isCandidato, isEmpresa } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const styles = {
    header: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)",
      borderBottom: "3px solid #e07b00",
      boxShadow: "0 2px 20px rgba(26,58,143,0.08)",
    },
    container: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 32px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logoWrapper: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      textDecoration: "none",
    },
    logoIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "linear-gradient(135deg, #1a3a8f, #e07b00)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 800,
      fontSize: 15,
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      flexShrink: 0,
    },
    logoText: {
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      fontWeight: 800,
      fontSize: 17,
      color: "#1a3a8f",
      lineHeight: 1.1,
    },
    logoSub: {
      fontSize: 9,
      color: "#e07b00",
      fontWeight: 700,
      letterSpacing: 3,
    },
    nav: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    navLink: {
      color: "#444",
      textDecoration: "none",
      fontSize: 14,
      fontWeight: 500,
      padding: "6px 14px",
      borderRadius: 8,
      transition: "color 0.2s, background 0.2s",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
    },
    btnOutline: {
      padding: "8px 20px",
      borderRadius: 8,
      border: "2px solid #1a3a8f",
      background: "transparent",
      color: "#1a3a8f",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      transition: "all 0.2s",
    },
    btnPrimary: {
      padding: "8px 20px",
      borderRadius: 8,
      border: "none",
      background: "linear-gradient(135deg, #1a3a8f, #2d52c4)",
      color: "white",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      boxShadow: "0 4px 14px rgba(26,58,143,0.3)",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      transition: "all 0.2s",
    },
    userMenu: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginLeft: 8,
      paddingLeft: 16,
      borderLeft: "1px solid #e8ecf4",
    },
    userAvatar: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1a3a8f, #e07b00)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 700,
      fontSize: 13,
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
    },
    userName: {
      fontSize: 13,
      fontWeight: 600,
      color: "#1a1a2e",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
    },
    btnLogout: {
      padding: "6px 14px",
      borderRadius: 8,
      border: "1px solid #fee2e2",
      background: "#fff5f5",
      color: "#dc2626",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      transition: "all 0.2s",
    },
  };

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        .nav-link-hover:hover { background: #f0f4ff !important; color: #1a3a8f !important; }
        .btn-outline-hover:hover { background: #1a3a8f !important; color: white !important; }
        .btn-primary-hover:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-logout-hover:hover { background: #fee2e2 !important; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.container}>

          {/* LOGO */}
          <Link to="/" style={styles.logoWrapper}>
            <div style={styles.logoIcon}>CL</div>
            <div>
              <div style={styles.logoText}>Conecta</div>
              <div style={styles.logoSub}>LAGOA</div>
            </div>
          </Link>

          {/* NAV */}
          <nav style={styles.nav}>
            {!user ? (
              <>
                <Link to="/sobre" className="nav-link-hover" style={styles.navLink}>Sobre</Link>
                <Link to="/vagas" className="nav-link-hover" style={styles.navLink}>Vagas</Link>
                <Link to="/empresas" className="nav-link-hover" style={styles.navLink}>Empresas</Link>
                <Link to="/blog" className="nav-link-hover" style={styles.navLink}>Blog</Link>
                <Link to="/login" className="btn-outline-hover" style={{ ...styles.btnOutline, marginLeft: 16 }}>Entrar</Link>
                <Link to="/registro" className="btn-primary-hover" style={styles.btnPrimary}>Cadastrar</Link>
              </>
            ) : (
              <>
                {isCandidato() && (
                  <>
                    <Link to="/candidato/dashboard" className="nav-link-hover" style={styles.navLink}>Meu Perfil</Link>
                    <Link to="/candidato/editar" className="nav-link-hover" style={styles.navLink}>Editar Perfil</Link>
                  </>
                )}

                {isEmpresa() && (
                  <>
                    <Link to="/empresa/dashboard" className="nav-link-hover" style={styles.navLink}>Dashboard</Link>
                    <Link to="/empresa/candidatos" className="nav-link-hover" style={styles.navLink}>Buscar Talentos</Link>
                    <Link to="/empresa/favoritos" className="nav-link-hover" style={styles.navLink}>Favoritos</Link>
                  </>
                )}

                <div style={styles.userMenu}>
                  <div style={styles.userAvatar}>{getInitials(user.nome)}</div>
                  <span style={styles.userName}>{user.nome}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-logout-hover"
                    style={styles.btnLogout}
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </nav>

        </div>
      </header>
    </>
  );
};

export default Header;