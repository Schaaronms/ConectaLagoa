import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// ── Lê o usuário do localStorage de forma SÍNCRONA
// Isso evita que o PrivateRoute veja user=null no primeiro render
// e redirecione para /login antes do useEffect rodar
const getInitialUser = () => {
  try {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      return JSON.parse(savedUser);
    }
  } catch (e) {}
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser); // inicializa SÍNCRONO
  const [loading, setLoading] = useState(false);     // já começa false

  useEffect(() => {
    // Apenas valida se ainda tem token (segurança extra)
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const login = async (email, senha, tipo) => {
    try {
      const response = await authAPI.login({ email, senha, tipo });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const registroCandidato = async (data) => {
    try {
      const response = await authAPI.registroCandidato(data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('needsOnboarding', 'true'); // Marcar que precisa onboarding
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao registrar' 
      };
    }
  };

  const registroEmpresa = async (data) => {
    try {
      const response = await authAPI.registroEmpresa(data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao registrar' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isCandidato = () => user?.tipo === 'candidato';
  const isEmpresa = () => user?.tipo === 'empresa';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        registroCandidato,
        registroEmpresa,
        isCandidato,
        isEmpresa
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};