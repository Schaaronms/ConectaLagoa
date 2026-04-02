import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Sobre from './pages/Sobre';
import Onboarding from './pages/Onboarding';
import CandidatoDashboard from './pages/CandidatoDashboard';
import EditarPerfil from './pages/EditarPerfil';
import EsqueceuSenha from './pages/EsqueceuSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Vagas from './pages/Vagas';
import Blog from './pages/Blog';
import EmpresaDashboard from './pages/EmpresaDashboard';
import AuthCallback from './pages/AuthCallback';
import { useState, useEffect, useRef } from 'react';
import { FaBars } from 'react-icons/fa';
import './index.css';

// Rota protegida com verificação de tipo
const PrivateRoute = ({ children, allowedType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner border-4 border-t-blue-600 border-solid rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
        
  }

  if (allowedType && user.tipo !== allowedType) {
    return <Navigate to="/" replace />;
  }

  return children;


};

function AppContent() {
  const { user } = useAuth();

  const showFooter = !user || (user.tipo !== 'candidato' && user.tipo !== 'empresa');

  return (
    <Router>
      <div className="app min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/vagas" element={<Vagas/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/candidato/registro" element={<Registro tipo="candidato" />} />
            <Route path="/empresa/registro" element={<Registro tipo="empresa" />} />
            <Route path="/candidato/login" element={<Login tipo="candidato" />} />
            <Route path="/empresa/login" element={<Login tipo="empresa" />} />
            <Route path="/candidato/esqueceu-senha" element={<EsqueceuSenha tipo="candidato" />} />
            <Route path="/empresa/esqueceu-senha" element={<EsqueceuSenha tipo="empresa" />} />
            <Route path="/candidato/redefinir-senha" element={<RedefinirSenha tipo="candidato" />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            

            {/* Rotas do Candidato (protegidas) */}
            <Route path="/candidato/onboarding" element={<PrivateRoute allowedType="candidato"><Onboarding /></PrivateRoute>} />
            <Route path="/candidato/dashboard"  element={<PrivateRoute allowedType="candidato"><CandidatoDashboard /></PrivateRoute>} />
            <Route path="/candidato/editar"     element={<PrivateRoute allowedType="candidato"><EditarPerfil /></PrivateRoute>} />

            {/* Rota principal da Empresa */}
            <Route
              path="/empresa/dashboard"
              element={
                <PrivateRoute allowedType="empresa">
                  <EmpresaDashboard />
                </PrivateRoute>
              }
            />

            {/* Rotas de subpáginas — redirecionam para o dashboard
                (os painéis agora são abas internas do EmpresaDashboard) */}
            <Route path="/empresa/colaboradores"  element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/indicadores-rh" element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/agenda"         element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/funil"          element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/ia"             element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/relatorios"      element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="/empresa/configuracoes"    element={<Navigate to="/empresa/dashboard" replace />} />

            {/* Redirecionamentos */}
            <Route path="/empresadashboard" element={<Navigate to="/empresa/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;