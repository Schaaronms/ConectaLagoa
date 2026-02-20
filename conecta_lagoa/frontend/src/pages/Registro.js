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
  
  const { registroCandidato, registroEmpresa } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (tipoUrl) {
      setTipo(tipoUrl);
    }
  }, [tipoUrl]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
      if (tipo === 'candidato') {
        navigate('/candidato/onboarding');
      } else {
        navigate('/empresa/dashboard');
      }
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Criar Conta</h2>
          
          {error && <div className="alert alert-error">{error}</div>}

          {/* Seletor de tipo */}
          <div className="tipo-selector">
            <button
              className={`tipo-btn ${tipo === 'candidato' ? 'active' : ''}`}
              onClick={() => setTipo('candidato')}
            >
              Sou Candidato
            </button>
            <button
              className={`tipo-btn ${tipo === 'empresa' ? 'active' : ''}`}
              onClick={() => setTipo('empresa')}
            >
              Sou Empresa
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                {tipo === 'candidato' ? 'Nome Completo' : 'Nome da Empresa'}
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {tipo === 'empresa' && (
              <div className="form-group">
                <label className="form-label">CNPJ (opcional)</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="form-input"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Senha</label>
              <input
                type="password"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="auth-footer">
            <p></p>
            <p>
              Já tem conta? <Link to="/login">Fazer login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;
