import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidatoAPI } from '../services/api';
import './Dashboard.css';

const CandidatoDashboard = () => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      const response = await candidatoAPI.getPerfil();
      setPerfil(response.data.candidato);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      if (type === 'curriculo') {
        await candidatoAPI.uploadCurriculo(file);
        setMessage({ type: 'success', text: 'Currículo enviado com sucesso!' });
      } else if (type === 'foto') {
        await candidatoAPI.uploadFoto(file);
        setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
      }
      loadPerfil();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro no upload. Tente novamente.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Meu Perfil</h1>
          <Link to="/candidato/editar" className="btn btn-primary">
            ✏️ Editar Perfil
          </Link>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-2">
          {/* Card de Informações Básicas */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Informações Pessoais</h3>
            </div>
            
            <div className="perfil-info">
              {perfil?.foto_url ? (
                <img 
                  src={`http://localhost:5000${perfil.foto_url}`} 
                  alt="Foto de perfil"
                  className="perfil-foto"
                />
              ) : (
                <div className="perfil-foto-placeholder">
                  <span>👤</span>
                </div>
              )}

              <div className="info-item">
                <label>Nome:</label>
                <span>{perfil?.nome_completo || '-'}</span>
              </div>

              <div className="info-item">
                <label>Email:</label>
                <span>{perfil?.email || '-'}</span>
              </div>

              <div className="info-item">
                <label>Telefone:</label>
                <span>{perfil?.telefone || '-'}</span>
              </div>

              <div className="info-item">
                <label>Localização:</label>
                <span>
                  {perfil?.cidade && perfil?.estado 
                    ? `${perfil.cidade}, ${perfil.estado}` 
                    : '-'}
                </span>
              </div>
            </div>

            <div className="file-upload">
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'foto')}
                  disabled={uploading}
                />
                {uploading ? 'Enviando...' : 'Alterar Foto'}
              </label>
            </div>
          </div>

          {/* Card de Currículo */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Currículo</h3>
            </div>

            {perfil?.curriculo_url ? (
              <div className="curriculo-info">
                <div className="curriculo-status">
                  ✓ Currículo enviado
                </div>
                <a 
                  href={`http://localhost:5000${perfil.curriculo_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Ver Currículo
                </a>
              </div>
            ) : (
              <div className="curriculo-empty">
                <p>📄 Nenhum currículo cadastrado</p>
                <p className="text-muted">Envie seu currículo em PDF</p>
              </div>
            )}

            <div className="file-upload mt-2">
              <label className="upload-label">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'curriculo')}
                  disabled={uploading}
                />
                {uploading ? 'Enviando...' : perfil?.curriculo_url ? 'Atualizar Currículo' : 'Enviar Currículo (PDF)'}
              </label>
            </div>
          </div>
        </div>

        {/* Sobre Mim */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sobre Mim</h3>
          </div>
          <p className="sobre-mim">
            {perfil?.sobre_mim || 'Adicione uma breve descrição sobre você...'}
          </p>
        </div>

       {/* Experiências */}
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Experiências Profissionais</h3>
  </div>
  {perfil?.experiencias && perfil.experiencias.length > 0 ? (
    <div className="experiencias-list">
      {perfil.experiencias.map((exp) => (
        <div key={exp.id} className="experiencia-item">
          <h4>{exp.cargo}</h4>
          <p className="empresa">{exp.empresa}</p>
          <p className="periodo">
            {/* Formata a data de AAAA-MM-DD para DD/MM/AAAA */}
            {exp.data_inicio ? new Date(exp.data_inicio).toLocaleDateString('pt-BR') : ''} 
            {' - '}
            {exp.trabalho_atual ? 'Atual' : (exp.data_termino ? new Date(exp.data_termino).toLocaleDateString('pt-BR') : '')}
          </p>
          {exp.descricao && <p className="descricao">{exp.descricao}</p>}
        </div>
      ))}
    </div>
  ) : (
    <p className="text-muted">Nenhuma experiência cadastrada</p>
  )}
</div>

        {/* Habilidades */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Habilidades</h3>
          </div>
          {perfil?.habilidades && perfil.habilidades.length > 0 ? (
            <div className="habilidades-list">
              {perfil.habilidades.map((hab) => (
                <span key={hab.id} className="badge badge-primary">
                  {hab.nome}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted">Nenhuma habilidade cadastrada</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatoDashboard;
