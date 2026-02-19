import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Auth.css';


const EsqueceuSenha = () => {
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('candidato');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setMensagem('');

    try {
      await authAPI.esqueceuSenha({ email, tipo });
      setMensagem('Se o email existir, você receberá as instruções em breve.');
    } catch (error) {
      setErro('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
        <div className='auth-container'>
      <h2>Esqueceu sua senha?</h2>
      <p>Informe o seu email e enviaremos as instruções para redefinir sua senha.</p>

      {mensagem && <div className="alert success">{mensagem}</div>}
      {erro && <div className="alert error">{erro}</div>}

      <form onSubmit={handleSubmit}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="candidato">Candidato</option>
          <option value="empresa">Empresa</option>
        </select>

        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar instruções'}
        </button>
      </form>

      <a href="/login">Voltar ao login</a>
    </div>
    </div>
  );
};

export default EsqueceuSenha;