import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Sobre from './pages/Sobre';
import Onboarding from './pages/Onboarding';
import CandidatoDashboard from './pages/CandidatoDashboard';
import EditarPerfil from './pages/EditarPerfil';
import EmpresaDashboard from './pages/EmpresaDashboard';
import EsqueceuSenha from './pages/EsqueceuSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Vagas from './pages/Vagas';           // ← importe sua página de vagas aqui
import { Blog} from './pages/Blog';               
import { Link } from 'react-router-dom';
import './index.css';

// Componente de rota protegida
const PrivateRoute = ({ children, allowedType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading min-h-screen flex items-center justify-center">
        <div className="spinner border-4 border-t-blue-600 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedType && user.tipo !== allowedType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="app min-h-screen flex flex-col">
        <Header />
        
        
        <main className="flex-grow">
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/vagas" element={<Vagas />} />               
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/blog" element={<Blog />} />
            {/* Rotas do Candidato (protegidas) */}
            <Route
              path="/candidato/onboarding"
              element={
                <PrivateRoute allowedType="candidato">
                  <Onboarding />
                </PrivateRoute>
              }
            />
            <Route
              path="/candidato/dashboard"
              element={
                <PrivateRoute allowedType="candidato">
                  <CandidatoDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/candidato/editar"
              element={
                <PrivateRoute allowedType="candidato">
                  <EditarPerfil />
                </PrivateRoute>
              }
            />

            {/* Rotas da Empresa (protegidas) */}
            <Route
              path="/empresa/dashboard"
              element={
                <PrivateRoute allowedType="empresa">
                  <EmpresaDashboard />
                </PrivateRoute>
              }
            />

            {/* Rota 404 / fallback */}
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