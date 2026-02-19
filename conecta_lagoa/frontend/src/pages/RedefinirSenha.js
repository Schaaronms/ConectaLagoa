import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const tipo = params.get('tipo');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    if (novaSenha !== confirmarSenha) {
      return setErro('As senhas não coincidem.');
    }

    if (novaSenha.length < 6) {
      return setErro('A senha deve ter no mínimo 6 caracteres.');
    }

    setLoading(true);

    try {
      await authAPI.redefinirSenha({ token, tipo, novaSenha });
      setMensagem('Senha redefinida com sucesso!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setErro('Token inválido ou expirado. Solicite um novo link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Redefinir senha</h2>

      {mensagem && <div className="alert success">{mensagem}</div>}
      {erro && <div className="alert error">{erro}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>

      <a href="/login">Voltar ao login</a>
    </div>
  );
};

export default RedefinirSenha;