import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Registro.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [emailError, setEmailError] = useState('');
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

  // Valida e-mail ao sair do campo
  const checkEmail = async () => {
    if (!formData.email) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/check-email?email=${encodeURIComponent(formData.email)}`);
      const data = await res.json();
      if (data.exists) {
        setEmailError('Este e-mail já está cadastrado');
      } else {
        setEmailError('');
      }
    } catch {
      // silencia erro de rede — o backend vai pegar no submit
    }
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

    if (emailError) {
      setError('Corrija o e-mail antes de continuar');
      return;
    }
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

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
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

          {/* Botão Google */}
          <button type="button" className="btn-google" onClick={handleGoogleLogin}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divisor */}
          <div className="divider"><span>ou cadastre-se com e-mail</span></div>

          {/* Erro global */}
          {error && (
            <div className="alert-error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
              </svg>
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
                onBlur={checkEmail}
                className={`field-input ${emailError ? 'input-error' : ''}`}
                placeholder="seu@email.com"
                required
              />
              {emailError && (
                <span className="field-hint error">
                  {emailError} — <Link to="/login" className="hint-link">Fazer login</Link>
                </span>
              )}
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

            <button type="submit" className="btn-submit" disabled={loading || !!emailError}>
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
