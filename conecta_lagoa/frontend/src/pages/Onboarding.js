import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatoAPI } from '../services/api';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Dados do perfil
  const [perfil, setPerfil] = useState({
    sobre_mim: '',
    linkedin_url: '',
    portfolio_url: ''
  });

  // Experiências (lista)
  const [experiencias, setExperiencias] = useState([{
    cargo: '',
    empresa: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    atual: false
  }]);

  // Formações (lista)
  const [formacoes, setFormacoes] = useState([{
    instituicao: '',
    curso: '',
    nivel: 'graduacao',
    data_inicio: '',
    data_conclusao: '',
    situacao: 'concluido'
  }]);

  // Habilidades (lista)
  const [habilidades, setHabilidades] = useState(['', '', '']);

  const handlePerfilChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const handleExperienciaChange = (index, field, value) => {
    const novasExperiencias = [...experiencias];
    novasExperiencias[index][field] = value;
    setExperiencias(novasExperiencias);
  };

  const adicionarExperiencia = () => {
    setExperiencias([...experiencias, {
      cargo: '',
      empresa: '',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      atual: false
    }]);
  };

  const removerExperiencia = (index) => {
    if (experiencias.length > 1) {
      setExperiencias(experiencias.filter((_, i) => i !== index));
    }
  };

  const handleFormacaoChange = (index, field, value) => {
    const novasFormacoes = [...formacoes];
    novasFormacoes[index][field] = value;
    setFormacoes(novasFormacoes);
  };

  const adicionarFormacao = () => {
    setFormacoes([...formacoes, {
      instituicao: '',
      curso: '',
      nivel: 'graduacao',
      data_inicio: '',
      data_conclusao: '',
      situacao: 'concluido'
    }]);
  };

  const removerFormacao = (index) => {
    if (formacoes.length > 1) {
      setFormacoes(formacoes.filter((_, i) => i !== index));
    }
  };

  const handleHabilidadeChange = (index, value) => {
    const novasHabilidades = [...habilidades];
    novasHabilidades[index] = value;
    setHabilidades(novasHabilidades);
  };

  const adicionarHabilidade = () => {
    setHabilidades([...habilidades, '']);
  };

  const removerHabilidade = (index) => {
    if (habilidades.length > 1) {
      setHabilidades(habilidades.filter((_, i) => i !== index));
    }
  };

  const handlePularEtapa = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/candidato/dashboard');
    }
  };

  const handleSalvarPerfil = async () => {
    setLoading(true);
    try {
      await candidatoAPI.atualizarPerfil(perfil);
      setCurrentStep(2);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarExperiencias = async () => {
    setLoading(true);
    try {
      // Salvar apenas experiências preenchidas
      const experienciasPreenchidas = experiencias.filter(exp => exp.cargo && exp.empresa);
      
      for (const exp of experienciasPreenchidas) {
        await candidatoAPI.adicionarExperiencia(exp);
      }
      
      setCurrentStep(3);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar experiências' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarFormacoes = async () => {
    setLoading(true);
    try {
      // Salvar apenas formações preenchidas
      const formacoesPreenchidas = formacoes.filter(form => form.instituicao && form.curso);
      
      for (const form of formacoesPreenchidas) {
        await candidatoAPI.adicionarFormacao(form);
      }
      
      setCurrentStep(4);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar formações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarHabilidades = async () => {
    setLoading(true);
    try {
      // Salvar apenas habilidades preenchidas
      const habilidadesPreenchidas = habilidades.filter(h => h.trim() !== '');
      
      for (const nome of habilidadesPreenchidas) {
        await candidatoAPI.adicionarHabilidade({ nome, nivel: 'intermediario' });
      }
      
      navigate('/candidato/dashboard');
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar habilidades' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="container">
        <div className="onboarding-header">
          <h1>Complete seu Perfil</h1>
          <p>Preencha suas informações para que empresas encontrem você</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Sobre Você</span>
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Experiências</span>
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Formação</span>
          </div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <span>Habilidades</span>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Etapa 1: Sobre Você */}
        {currentStep === 1 && (
          <div className="card">
            <h2 className="step-title">Conte um pouco sobre você</h2>
            
            <div className="form-group">
              <label className="form-label">Sobre Mim</label>
              <textarea
                name="sobre_mim"
                value={perfil.sobre_mim}
                onChange={handlePerfilChange}
                className="form-textarea"
                rows="6"
                placeholder="Escreva uma breve descrição sobre você, suas experiências e objetivos profissionais..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">LinkedIn (opcional)</label>
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
              <label className="form-label">Portfólio/Site (opcional)</label>
              <input
                type="url"
                name="portfolio_url"
                value={perfil.portfolio_url}
                onChange={handlePerfilChange}
                className="form-input"
                placeholder="https://seu-portfolio.com"
              />
            </div>

            <div className="button-group">
              <button onClick={handlePularEtapa} className="btn btn-outline">
                Pular esta etapa
              </button>
              <button 
                onClick={handleSalvarPerfil} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Experiências */}
        {currentStep === 2 && (
          <div className="card">
            <h2 className="step-title">Experiências Profissionais</h2>
            <p className="step-subtitle">Adicione suas experiências de trabalho</p>

            {experiencias.map((exp, index) => (
              <div key={index} className="dynamic-section">
                {index > 0 && <hr className="section-divider" />}
                
                <div className="section-header">
                  <h4>Experiência {index + 1}</h4>
                  {experiencias.length > 1 && (
                    <button 
                      onClick={() => removerExperiencia(index)}
                      className="btn-remove"
                    >
                      ✕ Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input
                      type="text"
                      value={exp.cargo}
                      onChange={(e) => handleExperienciaChange(index, 'cargo', e.target.value)}
                      className="form-input"
                      placeholder="Ex: Analista de Marketing"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Empresa</label>
                    <input
                      type="text"
                      value={exp.empresa}
                      onChange={(e) => handleExperienciaChange(index, 'empresa', e.target.value)}
                      className="form-input"
                      placeholder="Ex: Tech Company"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição (opcional)</label>
                  <textarea
                    value={exp.descricao}
                    onChange={(e) => handleExperienciaChange(index, 'descricao', e.target.value)}
                    className="form-textarea"
                    rows="3"
                    placeholder="Principais responsabilidades e conquistas..."
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Data de Início</label>
                    <input
                      type="month"
                      value={exp.data_inicio}
                      onChange={(e) => handleExperienciaChange(index, 'data_inicio', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Término</label>
                    <input
                      type="month"
                      value={exp.data_fim}
                      onChange={(e) => handleExperienciaChange(index, 'data_fim', e.target.value)}
                      className="form-input"
                      disabled={exp.atual}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={exp.atual}
                      onChange={(e) => handleExperienciaChange(index, 'atual', e.target.checked)}
                    />
                    <span>Trabalho aqui atualmente</span>
                  </label>
                </div>
              </div>
            ))}

            <button onClick={adicionarExperiencia} className="btn btn-outline btn-full mt-2">
              ➕ Adicionar Outra Experiência
            </button>

            <div className="button-group mt-3">
              <button onClick={handlePularEtapa} className="btn btn-outline">
                Pular esta etapa
              </button>
              <button 
                onClick={handleSalvarExperiencias} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Formação */}
        {currentStep === 3 && (
          <div className="card">
            <h2 className="step-title">Formação Acadêmica</h2>
            <p className="step-subtitle">Adicione sua educação</p>

            {formacoes.map((form, index) => (
              <div key={index} className="dynamic-section">
                {index > 0 && <hr className="section-divider" />}
                
                <div className="section-header">
                  <h4>Formação {index + 1}</h4>
                  {formacoes.length > 1 && (
                    <button 
                      onClick={() => removerFormacao(index)}
                      className="btn-remove"
                    >
                      ✕ Remover
                    </button>
                  )}
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Instituição</label>
                    <input
                      type="text"
                      value={form.instituicao}
                      onChange={(e) => handleFormacaoChange(index, 'instituicao', e.target.value)}
                      className="form-input"
                      placeholder="Ex: Universidade Federal"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Curso</label>
                    <input
                      type="text"
                      value={form.curso}
                      onChange={(e) => handleFormacaoChange(index, 'curso', e.target.value)}
                      className="form-input"
                      placeholder="Ex: Administração"
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Nível</label>
                    <select
                      value={form.nivel}
                      onChange={(e) => handleFormacaoChange(index, 'nivel', e.target.value)}
                      className="form-select"
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
                    <label className="form-label">Situação</label>
                    <select
                      value={form.situacao}
                      onChange={(e) => handleFormacaoChange(index, 'situacao', e.target.value)}
                      className="form-select"
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
                      value={form.data_inicio}
                      onChange={(e) => handleFormacaoChange(index, 'data_inicio', e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Conclusão</label>
                    <input
                      type="month"
                      value={form.data_conclusao}
                      onChange={(e) => handleFormacaoChange(index, 'data_conclusao', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={adicionarFormacao} className="btn btn-outline btn-full mt-2">
              ➕ Adicionar Outra Formação
            </button>

            <div className="button-group mt-3">
              <button onClick={handlePularEtapa} className="btn btn-outline">
                Pular esta etapa
              </button>
              <button 
                onClick={handleSalvarFormacoes} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Próximo →'}
              </button>
            </div>
          </div>
        )}

        {/* Etapa 4: Habilidades */}
        {currentStep === 4 && (
          <div className="card">
            <h2 className="step-title">Habilidades</h2>
            <p className="step-subtitle">Liste suas principais habilidades</p>

            {habilidades.map((hab, index) => (
              <div key={index} className="habilidade-input-group">
                <input
                  type="text"
                  value={hab}
                  onChange={(e) => handleHabilidadeChange(index, e.target.value)}
                  className="form-input"
                  placeholder={`Habilidade ${index + 1} (ex: Excel, Liderança, Inglês)`}
                />
                {habilidades.length > 1 && (
                  <button 
                    onClick={() => removerHabilidade(index)}
                    className="btn-remove-inline"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button onClick={adicionarHabilidade} className="btn btn-outline btn-full mt-2">
              ➕ Adicionar Outra Habilidade
            </button>

            <div className="button-group mt-3">
              <button onClick={handlePularEtapa} className="btn btn-outline">
                Pular esta etapa
              </button>
              <button 
                onClick={handleSalvarHabilidades} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Salvando...' : '✓ Finalizar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
