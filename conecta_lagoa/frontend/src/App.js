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
import './index.css';

// Componente de rota protegida
const PrivateRoute = ({ children, allowedType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedType && user.tipo !== allowedType) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/sobre" element={<Sobre />} />

            {/* Rotas do Candidato */}
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

            {/* Rotas da Empresa */}
            <Route
              path="/empresa/dashboard"
              element={
                <PrivateRoute allowedType="empresa">
                  <EmpresaDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/empresa/candidatos"
              element={
                <PrivateRoute allowedType="empresa">
                  <EmpresaDashboard />
                </PrivateRoute>
              }
            />

            {/* Rota 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2026 Conecta Lagoa. Todos os direitos reservados.</p>
          </div>
        </footer>
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
