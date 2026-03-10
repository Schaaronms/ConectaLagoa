// ================================================================
// pages/AuthCallback.jsx — Conecta Lagoa
// Página intermediária que captura o token do Google OAuth
// e redireciona o usuário para o dashboard correto.
//
// Adicionar no App.jsx/Router:
//   <Route path="/auth/callback" element={<AuthCallback />} />
// ================================================================
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate     = useNavigate();
  const { loginComToken } = useAuth();

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const destino = params.get('destino') || '/candidato/dashboard';
    const erro    = params.get('error');

    if (erro) {
      navigate('/login?error=google', { replace: true });
      return;
    }

    if (token) {
      loginComToken(token);          // salva no contexto + localStorage
      navigate(destino, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#eef1f8',
      fontFamily: 'sans-serif',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #e8ecf4',
        borderTop: '3px solid #1a3a8f',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Autenticando com Google...</p>
    </div>
  );
};

export default AuthCallback;
