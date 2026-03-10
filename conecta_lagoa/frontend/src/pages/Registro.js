import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Registro.css';

const Registro = () => {
  const [searchParams] = useSearchParams();
  const tipoUrl = searchParams.get('tipo');
  
  const [tipo, setTipo] = useState(tipoUrl || 'candidato');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cidade: '',
    estado: '',
    cnpj: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [senhaFocus, setSenhaFocus] = useState(false);
  
  const { registroCandidato, registroEmpresa } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (tipoUrl) setTipo(tipoUrl);
  }, [tipoUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const senhaStrength = () => {
    const s = formData.senha;
    if (!s) return 0;
    let score = 0;
    if (s.length >= 6) score++;
    if (s.length >= 10) score++;
    if (/[A-Z]/.test(s)) score++;
    if (/[0-9]/.test(s)) score++;
    if (/[^A-Za-z0-9]/.test(s)) score++;
    return score;
  };

  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (tipo === 'empresa' && !formData.cnpj.trim()) {
  setError('O CNPJ é obrigatório para empresas');
  return;
}

    setLoading(true);

    const data = {
      email: formData.email,
      senha: formData.senha,
      telefone: formData.telefone,
      cidade: formData.cidade,
      estado: formData.estado
    };

    let result;
    if (tipo === 'candidato') {
      data.nome_completo = formData.nome;
      result = await registroCandidato(data);
    } else {
      data.nome = formData.nome;
      data.cnpj = formData.cnpj;
      result = await registroEmpresa(data);
    }

    if (result.success) {
      navigate(tipo === 'candidato' ? '/candidato/onboarding' : '/empresa/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const strength = senhaStrength();

  return (
    <div className="registro-page">
      <div className="registro-wrapper">

        {/* Header */}
        <div className="registro-header">
          
          <h1 className="registro-title">Criar sua conta</h1>
          <p className="registro-subtitle">Junte-se à plataforma de empregos de Lagoa Vermelha</p>
        </div>

        {/* Card */}
        <div className="registro-card">

          {/* Tipo selector */}
          <div className="tipo-selector">
            <button
              type="button"
              className={`tipo-btn ${tipo === 'candidato' ? 'active' : ''}`}
              onClick={() => setTipo('candidato')}
            >
              <span className="tipo-icon">👤</span>
              Candidato
            </button>
            <button
              type="button"
              className={`tipo-btn ${tipo === 'empresa' ? 'active' : ''}`}
              onClick={() => setTipo('empresa')}
            >
              <span className="tipo-icon">🏢</span>
              Empresa
            </button>
          </div>

          {error && (
            <div className="alert-error">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registro-form">

            {/* Nome */}
            <div className="field-group">
              <label className="field-label">
                {tipo === 'candidato' ? 'Nome Completo' : 'Nome da Empresa'}
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="field-input"
                placeholder={tipo === 'candidato' ? 'Seu nome completo' : 'Razão social ou nome fantasia'}
                required
              />
            </div>

            {/* Email */}
            <div className="field-group">
              <label className="field-label">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="field-input"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* CNPJ — só empresa */}
            {tipo === 'empresa' && (
              <div className="field-group">
               <label className="field-label">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            )}

            {/* Telefone + Cidade em linha */}
            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="Sua cidade"
                />
              </div>
            </div>

            {/* Estado */}
            <div className="field-group">
              <label className="field-label">Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="field-input field-select"
              >
                <option value="">Selecione o estado</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            {/* Senha */}
            <div className="field-group">
              <label className="field-label">Senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                onFocus={() => setSenhaFocus(true)}
                onBlur={() => setSenhaFocus(false)}
                className="field-input"
                placeholder="Mínimo 6 caracteres"
                required
              />
              {(senhaFocus || formData.senha) && (
                <div className="senha-strength">
                  <div className="strength-bars">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="strength-bar"
                        style={{ background: i <= strength ? strengthColor[strength] : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  {formData.senha && (
                    <span className="strength-label" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="field-group">
              <label className="field-label">Confirmar Senha</label>
              <input
                type="password"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                className={`field-input ${
                  formData.confirmarSenha && formData.senha !== formData.confirmarSenha
                    ? 'input-error' : ''
                }`}
                placeholder="Repita a senha"
                required
              />
              {formData.confirmarSenha && formData.senha !== formData.confirmarSenha && (
                <span className="field-hint error">As senhas não coincidem</span>
              )}
              {formData.confirmarSenha && formData.senha === formData.confirmarSenha && (
                <span className="field-hint success">✓ Senhas coincidem</span>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Criando conta...
                </>
              ) : (
                `Criar conta como ${tipo === 'candidato' ? 'Candidato' : 'Empresa'}`
              )}
            </button>

          </form>
        </div>

        <p className="registro-footer">
          Já tem conta?{' '}
          <Link to="/login" className="registro-link">Fazer login</Link>
        </p>

        <Link to="/" className="registro-back">← Voltar ao início</Link>
      </div>
    </div>
  );
};

export default Registro;