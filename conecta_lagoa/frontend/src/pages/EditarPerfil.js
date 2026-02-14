import React, { useState, useEffect } from 'react';
import { candidatoAPI } from '../services/api';
import './EditarPerfil.css';

const EditarPerfil = () => {
  const [perfil, setPerfil] = useState({
    nome_completo: '',
    telefone: '',
    data_nascimento: '',
    cidade: '',
    estado: '',
    endereco: '',
    sobre_mim: '',
    linkedin_url: '',
    portfolio_url: ''
  });

  const [experiencia, setExperiencia] = useState({
    cargo: '',
    empresa: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    atual: false
  });

  const [formacao, setFormacao] = useState({
    instituicao: '',
    curso: '',
    nivel: 'graduacao',
    data_inicio: '',
    data_conclusao: '',
    situacao: 'concluido'
  });

  const [habilidade, setHabilidade] = useState({
    nome: '',
    nivel: 'intermediario'
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados-pessoais');

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      const response = await candidatoAPI.getPerfil();
      const data = response.data.candidato;
      setPerfil({
        nome_completo: data.nome_completo || '',
        telefone: data.telefone || '',
        data_nascimento: data.data_nascimento || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        endereco: data.endereco || '',
        sobre_mim: data.sobre_mim || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handlePerfilChange = (e) => {
    setPerfil({
      ...perfil,
      [e.target.name]: e.target.value
    });
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await candidatoAPI.atualizarPerfil(perfil);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      window.scrollTo(0, 0);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarExperiencia = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await candidatoAPI.adicionarExperiencia(experiencia);
      setMessage({ type: 'success', text: 'Experiência adicionada!' });
      setExperiencia({
        cargo: '',
        empresa: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        atual: false
      });
      loadPerfil();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao adicionar experiência' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarFormacao = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await candidatoAPI.adicionarFormacao(formacao);
      setMessage({ type: 'success', text: 'Formação adicionada!' });
      setFormacao({
        instituicao: '',
        curso: '',
        nivel: 'graduacao',
        data_inicio: '',
        data_conclusao: '',
        situacao: 'concluido'
      });
      loadPerfil();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao adicionar formação' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarHabilidade = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await candidatoAPI.adicionarHabilidade(habilidade);
      setMessage({ type: 'success', text: 'Habilidade adicionada!' });
      setHabilidade({ nome: '', nivel: 'intermediario' });
      loadPerfil();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao adicionar habilidade' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editar-perfil">
      <div className="container">
        <h1 className="page-title">Editar Perfil</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'dados-pessoais' ? 'active' : ''}`}
            onClick={() => setActiveTab('dados-pessoais')}
          >
            📋 Dados Pessoais
          </button>
          <button 
            className={`tab ${activeTab === 'experiencias' ? 'active' : ''}`}
            onClick={() => setActiveTab('experiencias')}
          >
            💼 Experiências
          </button>
          <button 
            className={`tab ${activeTab === 'formacao' ? 'active' : ''}`}
            onClick={() => setActiveTab('formacao')}
          >
            🎓 Formação
          </button>
          <button 
            className={`tab ${activeTab === 'habilidades' ? 'active' : ''}`}
            onClick={() => setActiveTab('habilidades')}
          >
            ⭐ Habilidades
          </button>
        </div>

        {/* Dados Pessoais */}
        {activeTab === 'dados-pessoais' && (
          <div className="card">
            <form onSubmit={handleSalvarPerfil}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  name="nome_completo"
                  value={perfil.nome_completo}
                  onChange={handlePerfilChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    value={perfil.telefone}
                    onChange={handlePerfilChange}
                    className="form-input"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Nascimento</label>
                  <input
                    type="date"
                    name="data_nascimento"
                    value={perfil.data_nascimento}
                    onChange={handlePerfilChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={perfil.cidade}
                    onChange={handlePerfilChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    name="estado"
                    value={perfil.estado}
                    onChange={handlePerfilChange}
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
                <label className="form-label">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  value={perfil.endereco}
                  onChange={handlePerfilChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sobre Mim</label>
                <textarea
                  name="sobre_mim"
                  value={perfil.sobre_mim}
                  onChange={handlePerfilChange}
                  className="form-textarea"
                  rows="5"
                  placeholder="Conte um pouco sobre você, suas experiências e objetivos profissionais..."
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={perfil.linkedin_url}
                    onChange={handlePerfilChange}
                    className="form-input"
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Portfólio</label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={perfil.portfolio_url}
                    onChange={handlePerfilChange}
                    className="form-input"
                    placeholder="https://seu-portfolio.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        )}

        {/* Experiências */}
        {activeTab === 'experiencias' && (
          <div className="card">
            <h3 className="section-title">Adicionar Experiência Profissional</h3>
            
            <form onSubmit={handleAdicionarExperiencia}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Cargo *</label>
                  <input
                    type="text"
                    value={experiencia.cargo}
                    onChange={(e) => setExperiencia({...experiencia, cargo: e.target.value})}
                    className="form-input"
                    placeholder="Ex: Desenvolvedor Full Stack"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa *</label>
                  <input
                    type="text"
                    value={experiencia.empresa}
                    onChange={(e) => setExperiencia({...experiencia, empresa: e.target.value})}
                    className="form-input"
                    placeholder="Ex: Tech Company"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição das Atividades</label>
                <textarea
                  value={experiencia.descricao}
                  onChange={(e) => setExperiencia({...experiencia, descricao: e.target.value})}
                  className="form-textarea"
                  rows="4"
                  placeholder="Descreva suas principais responsabilidades e conquistas..."
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Data de Início *</label>
                  <input
                    type="month"
                    value={experiencia.data_inicio}
                    onChange={(e) => setExperiencia({...experiencia, data_inicio: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Término</label>
                  <input
                    type="month"
                    value={experiencia.data_fim}
                    onChange={(e) => setExperiencia({...experiencia, data_fim: e.target.value})}
                    className="form-input"
                    disabled={experiencia.atual}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={experiencia.atual}
                    onChange={(e) => setExperiencia({...experiencia, atual: e.target.checked, data_fim: ''})}
                  />
                  <span>Trabalho aqui atualmente</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary btn-full"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : '➕ Adicionar Experiência'}
              </button>
            </form>
          </div>
        )}

        {/* Formação */}
        {activeTab === 'formacao' && (
          <div className="card">
            <h3 className="section-title">Adicionar Formação Acadêmica</h3>
            
            <form onSubmit={handleAdicionarFormacao}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Instituição *</label>
                  <input
                    type="text"
                    value={formacao.instituicao}
                    onChange={(e) => setFormacao({...formacao, instituicao: e.target.value})}
                    className="form-input"
                    placeholder="Ex: Universidade Federal"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Curso *</label>
                  <input
                    type="text"
                    value={formacao.curso}
                    onChange={(e) => setFormacao({...formacao, curso: e.target.value})}
                    className="form-input"
                    placeholder="Ex: Ciência da Computação"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Nível *</label>
                  <select
                    value={formacao.nivel}
                    onChange={(e) => setFormacao({...formacao, nivel: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="medio">Ensino Médio</option>
                    <option value="tecnico">Técnico</option>
                    <option value="graduacao">Graduação</option>
                    <option value="pos-graduacao">Pós-Graduação</option>
                    <option value="mestrado">Mestrado</option>
                    <option value="doutorado">Doutorado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Situação *</label>
                  <select
                    value={formacao.situacao}
                    onChange={(e) => setFormacao({...formacao, situacao: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="concluido">Concluído</option>
                    <option value="cursando">Cursando</option>
                    <option value="incompleto">Incompleto</option>
                    <option value="trancado">Trancado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Data de Início</label>
                  <input
                    type="month"
                    value={formacao.data_inicio}
                    onChange={(e) => setFormacao({...formacao, data_inicio: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Data de Conclusão</label>
                  <input
                    type="month"
                    value={formacao.data_conclusao}
                    onChange={(e) => setFormacao({...formacao, data_conclusao: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary btn-full"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : '➕ Adicionar Formação'}
              </button>
            </form>
          </div>
        )}

        {/* Habilidades */}
        {activeTab === 'habilidades' && (
          <div className="card">
            <h3 className="section-title">Adicionar Habilidade</h3>
            
            <form onSubmit={handleAdicionarHabilidade}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Habilidade *</label>
                  <input
                    type="text"
                    value={habilidade.nome}
                    onChange={(e) => setHabilidade({...habilidade, nome: e.target.value})}
                    className="form-input"
                    placeholder="Ex: JavaScript, Excel, Liderança"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nível</label>
                  <select
                    value={habilidade.nivel}
                    onChange={(e) => setHabilidade({...habilidade, nivel: e.target.value})}
                    className="form-select"
                  >
                    <option value="basico">Básico</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary btn-full"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : '➕ Adicionar Habilidade'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditarPerfil;
