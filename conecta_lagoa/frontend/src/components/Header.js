import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isCandidato, isEmpresa } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/">
              <img src="/logo.png" alt="Conecta Lagoa" />
            </Link>
          </div>

          <nav className="nav">
            {!user ? (
              <>
                <Link to="/sobre" className="nav-link">Sobre</Link>
                <Link to="/login" className="nav-link">Entrar</Link>
                <Link to="/registro" className="btn btn-primary">Cadastrar</Link>
              </>
            ) : (
              <>
                {isCandidato() && (
                  <>
                    <Link to="/candidato/dashboard" className="nav-link">Meu Perfil</Link>
                    <Link to="/candidato/editar" className="nav-link">Editar Perfil</Link>
                  </>
                )}
                
                {isEmpresa() && (
                  <>
                    <Link to="/empresa/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/empresa/candidatos" className="nav-link">Buscar Talentos</Link>
                    <Link to="/empresa/favoritos" className="nav-link">Favoritos</Link>
                  </>
                )}

                <div className="user-menu">
                  <span className="user-name">{user.nome}</span>
                  <button onClick={handleLogout} className="btn-logout">
                    Sair
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
