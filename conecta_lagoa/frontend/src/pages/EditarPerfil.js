import React, { useState, useEffect, useRef } from 'react';
import { candidatoAPI } from '../services/api';
import './EditarPerfil.css';

// ─── helpers de data ────────────────────────────────────────────────────────
// "2024-03"    → "2024-03-01"  (month input → DATE para o postgres)
// "2024-03-15" → "2024-03"     (DATE do banco → month input)
const monthToDate  = (v) => (v && v.length === 7 ? `${v}-01` : v || null);
const dateToMonth  = (v) => (v ? String(v).slice(0, 7) : '');
// "2001-06-15T..." → "2001-06-15"  (datetime do banco → date input)
const dateToInput  = (v) => (v ? String(v).slice(0, 10) : '');

const BASE_URL = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';

// ─── estilos inline (mantém consistência com o restante do projeto) ──────────
const S = {
  photoWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, marginBottom: 28,
  },
  avatarRing: {
    width: 100, height: 100, borderRadius: '50%',
    border: '3px solid #1a3a8f', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#1a3a8f,#e07b00)',
    cursor: 'pointer', position: 'relative',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitials: {
    fontSize: 32, fontWeight: 800, color: 'white', userSelect: 'none',
  },
  avatarOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity .2s', borderRadius: '50%',
    fontSize: 22,
  },
  photoHint: { fontSize: 12, color: '#94a3b8' },
  photoUploading: {
    fontSize: 12, color: '#1a3a8f', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
  },

  pdfSection: {
    border: '2px dashed #bfdbfe', borderRadius: 12, padding: 20,
    textAlign: 'center', marginBottom: 24, background: '#f8faff',
    cursor: 'pointer', transition: 'border-color .2s, background .2s',
  },
  pdfSectionHover: {
    borderColor: '#1a3a8f', background: '#eff6ff',
  },
  pdfIcon: { fontSize: 32, marginBottom: 6 },
  pdfTitle: { fontWeight: 700, color: '#1a3a8f', fontSize: 14, marginBottom: 4 },
  pdfSub: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  pdfProgress: {
    height: 6, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden', marginTop: 8,
  },
  pdfProgressFill: (pct) => ({
    height: '100%', width: `${pct}%`,
    background: 'linear-gradient(90deg,#1a3a8f,#2d52c4)',
    transition: 'width .3s', borderRadius: 100,
  }),
  pdfResult: {
    marginTop: 12, padding: '10px 14px', borderRadius: 8,
    background: '#dcfce7', border: '1px solid #86efac',
    fontSize: 13, color: '#15803d', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  pdfError: {
    marginTop: 12, padding: '10px 14px', borderRadius: 8,
    background: '#fee2e2', border: '1px solid #fca5a5',
    fontSize: 13, color: '#dc2626', fontWeight: 600,
  },
};

// ─── componente ──────────────────────────────────────────────────────────────
const EditarPerfil = () => {
  const [perfil, setPerfil] = useState({
    nome_completo: '', telefone: '', data_nascimento: '',
    cidade: '', estado: '', endereco: '', sobre_mim: '',
    linkedin_url: '', portfolio_url: '', foto_url: '',
  });

  const [experiencia, setExperiencia] = useState({
    cargo: '', empresa: '', descricao: '',
    data_inicio: '', data_fim: '', atual: false,
  });

  const [formacao, setFormacao] = useState({
    instituicao: '', curso: '', nivel: 'graduacao',
    data_inicio: '', data_conclusao: '', situacao: 'concluido',
  });

  const [habilidade, setHabilidade] = useState({ nome: '', nivel: 'intermediario' });

  const [message,    setMessage]    = useState({ type: '', text: '' });
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('dados-pessoais');

  // foto
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [avatarHover,    setAvatarHover]    = useState(false);
  const photoRef = useRef(null);

  // PDF
  const [pdfDragOver,    setPdfDragOver]    = useState(false);
  const [pdfUploading,   setPdfUploading]   = useState(false);
  const [pdfProgress,    setPdfProgress]    = useState(0);
  const [pdfResult,      setPdfResult]      = useState(null); // { nome, telefone, ... }
  const [pdfError,       setPdfError]       = useState('');
  const pdfRef = useRef(null);

  useEffect(() => { loadPerfil(); }, []);

  const loadPerfil = async () => {
    try {
      const response = await candidatoAPI.getPerfil();
      const d = response.data.candidato;
      setPerfil({
        nome_completo:  d.nome_completo  || '',
        telefone:       d.telefone       || '',
        // ← FIX: normaliza datetime/date do banco para "YYYY-MM-DD"
        data_nascimento: dateToInput(d.data_nascimento),
        cidade:          d.cidade        || '',
        estado:          d.estado        || '',
        endereco:        d.endereco      || '',
        sobre_mim:       d.sobre_mim     || '',
        linkedin_url:    d.linkedin_url  || '',
        portfolio_url:   d.portfolio_url || '',
        foto_url:        d.foto_url      || '',
      });
      if (d.foto_url) setPhotoPreview(d.foto_url);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  };

  const handlePerfilChange = (e) => {
    setPerfil(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── salvar dados pessoais ────────────────────────────────────────────────
  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // ← FIX: envia data_nascimento como string "YYYY-MM-DD" pura — sem conversão extra
      // O input[type="date"] já retorna "YYYY-MM-DD", o banco aceita direto.
      await candidatoAPI.atualizarPerfil(perfil);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      window.scrollTo(0, 0);
    } catch {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  // ── upload de foto ───────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Foto muito grande. Máximo 5 MB.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Selecione uma imagem (JPG, PNG, WebP).' });
      return;
    }
    // preview imediato
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append('foto', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/usuarios/foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro no upload');
      setPerfil(prev => ({ ...prev, foto_url: data.foto_url }));
      setPhotoPreview(data.foto_url);
      setMessage({ type: 'success', text: 'Foto atualizada! ✓' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setPhotoPreview(perfil.foto_url || null);
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── upload + parse de PDF ────────────────────────────────────────────────
  const handlePdfFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Selecione um arquivo PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('PDF muito grande. Máximo 10 MB.');
      return;
    }
    setPdfError('');
    setPdfResult(null);
    setPdfUploading(true);
    setPdfProgress(10);

    try {
      const form = new FormData();
      form.append('curriculo', file);
      const token = localStorage.getItem('token');

      // simula progresso enquanto faz upload
      const ticker = setInterval(() => {
        setPdfProgress(p => (p < 80 ? p + 10 : p));
      }, 300);

      const res = await fetch(`${BASE_URL}/usuarios/curriculo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      clearInterval(ticker);
      setPdfProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao processar currículo');

      // preenche campos automaticamente com o que foi extraído
      if (data.dados) {
        const d = data.dados;
        setPerfil(prev => ({
          ...prev,
          nome_completo:  d.nome     || prev.nome_completo,
          telefone:       d.telefone || prev.telefone,
          cidade:         d.cidade   || prev.cidade,
          sobre_mim:      d.resumo   || prev.sobre_mim,
          linkedin_url:   d.linkedin || prev.linkedin_url,
        }));
      }
      setPdfResult(data.dados);
      setMessage({ type: 'success', text: `Currículo importado! ${data.msg || ''}` });
    } catch (err) {
      setPdfError(err.message);
      setPdfProgress(0);
    } finally {
      setPdfUploading(false);
    }
  };

  // drag-and-drop
  const handlePdfDrop = (e) => {
    e.preventDefault();
    setPdfDragOver(false);
    handlePdfFile(e.dataTransfer.files[0]);
  };

  // ── experiência ──────────────────────────────────────────────────────────
  const handleAdicionarExperiencia = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ← FIX: converte "YYYY-MM" → "YYYY-MM-01" antes de enviar
      await candidatoAPI.adicionarExperiencia({
        ...experiencia,
        data_inicio: monthToDate(experiencia.data_inicio),
        data_fim:    experiencia.atual ? null : monthToDate(experiencia.data_fim),
      });
      setMessage({ type: 'success', text: 'Experiência adicionada!' });
      setExperiencia({ cargo: '', empresa: '', descricao: '', data_inicio: '', data_fim: '', atual: false });
      loadPerfil();
    } catch {
      setMessage({ type: 'error', text: 'Erro ao adicionar experiência' });
    } finally {
      setLoading(false);
    }
  };

  // ── formação ─────────────────────────────────────────────────────────────
  const handleAdicionarFormacao = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ← FIX: converte "YYYY-MM" → "YYYY-MM-01"
      await candidatoAPI.adicionarFormacao({
        ...formacao,
        data_inicio:    monthToDate(formacao.data_inicio),
        data_conclusao: monthToDate(formacao.data_conclusao),
      });
      setMessage({ type: 'success', text: 'Formação adicionada!' });
      setFormacao({ instituicao: '', curso: '', nivel: 'graduacao', data_inicio: '', data_conclusao: '', situacao: 'concluido' });
      loadPerfil();
    } catch {
      setMessage({ type: 'error', text: 'Erro ao adicionar formação' });
    } finally {
      setLoading(false);
    }
  };

  // ── habilidade ───────────────────────────────────────────────────────────
  const handleAdicionarHabilidade = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await candidatoAPI.adicionarHabilidade(habilidade);
      setMessage({ type: 'success', text: 'Habilidade adicionada!' });
      setHabilidade({ nome: '', nivel: 'intermediario' });
      loadPerfil();
    } catch {
      setMessage({ type: 'error', text: 'Erro ao adicionar habilidade' });
    } finally {
      setLoading(false);
    }
  };

  // ── helpers de UI ────────────────────────────────────────────────────────
  const getInitials = (nome) => {
    if (!nome) return '?';
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="editar-perfil">
      <div className="container">
        <h1 className="page-title">Editar Perfil</h1>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'dados-pessoais', label: '📋 Dados Pessoais' },
            { key: 'curriculo',      label: '📄 Currículo PDF'  },
            { key: 'experiencias',   label: '💼 Experiências'   },
            { key: 'formacao',       label: '🎓 Formação'       },
            { key: 'habilidades',    label: '⭐ Habilidades'    },
          ].map(t => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ABA: DADOS PESSOAIS ── */}
        {activeTab === 'dados-pessoais' && (
          <div className="card">

            {/* ── Foto de perfil ── */}
            <div style={S.photoWrap}>
              <div
                style={S.avatarRing}
                onClick={() => photoRef.current?.click()}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                title="Clique para trocar a foto"
              >
                {photoPreview
                  ? <img src={photoPreview} alt="Foto" style={S.avatarImg} />
                  : <span style={S.avatarInitials}>{getInitials(perfil.nome_completo)}</span>
                }
                <div style={{ ...S.avatarOverlay, opacity: avatarHover ? 1 : 0 }}>📷</div>
              </div>

              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />

              {photoUploading
                ? <span style={S.photoUploading}>⏳ Enviando foto...</span>
                : <span style={S.photoHint}>Clique na foto para alterar · JPG, PNG, WebP · máx 5 MB</span>
              }
            </div>

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
                  {/* input[type="date"] → valor "YYYY-MM-DD" → banco aceita direto */}
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
                  <input type="text" name="cidade" value={perfil.cidade} onChange={handlePerfilChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select name="estado" value={perfil.estado} onChange={handlePerfilChange} className="form-select">
                    <option value="">Selecione</option>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                      'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
                      .map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input type="text" name="endereco" value={perfil.endereco} onChange={handlePerfilChange} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Sobre Mim</label>
                <textarea
                  name="sobre_mim"
                  value={perfil.sobre_mim}
                  onChange={handlePerfilChange}
                  className="form-textarea"
                  rows="5"
                  placeholder="Conte um pouco sobre você, suas experiências e objetivos..."
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">LinkedIn</label>
                  <input type="url" name="linkedin_url" value={perfil.linkedin_url} onChange={handlePerfilChange} className="form-input" placeholder="https://linkedin.com/in/seu-perfil" />
                </div>
                <div className="form-group">
                  <label className="form-label">Portfólio</label>
                  <input type="url" name="portfolio_url" value={perfil.portfolio_url} onChange={handlePerfilChange} className="form-input" placeholder="https://seu-portfolio.com" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        )}

        {/* ── ABA: CURRÍCULO PDF ── */}
        {activeTab === 'curriculo' && (
          <div className="card">
            <h3 className="section-title">Importar Currículo em PDF</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              Faça upload do seu currículo em PDF. O sistema irá extrair automaticamente seus dados
              (nome, telefone, cidade, resumo e LinkedIn) e preencher os campos do seu perfil.
            </p>

            {/* drop zone */}
            <div
              style={{
                ...S.pdfSection,
                ...(pdfDragOver ? S.pdfSectionHover : {}),
              }}
              onClick={() => pdfRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
              onDragLeave={() => setPdfDragOver(false)}
              onDrop={handlePdfDrop}
            >
              <div style={S.pdfIcon}>{pdfUploading ? '⏳' : '📄'}</div>
              <div style={S.pdfTitle}>
                {pdfUploading ? 'Processando seu currículo...' : 'Arraste o PDF aqui ou clique para selecionar'}
              </div>
              <div style={S.pdfSub}>PDF · máximo 10 MB</div>

              {!pdfUploading && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ pointerEvents: 'none' }}
                >
                  Selecionar PDF
                </button>
              )}

              {pdfUploading && (
                <div style={S.pdfProgress}>
                  <div style={S.pdfProgressFill(pdfProgress)} />
                </div>
              )}
            </div>

            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handlePdfFile(e.target.files?.[0])}
            />

            {/* resultado */}
            {pdfResult && (
              <div style={S.pdfResult}>
                ✓ Dados extraídos e campos preenchidos automaticamente!
                Revise e salve na aba <strong>Dados Pessoais</strong>.
              </div>
            )}
            {pdfError && <div style={S.pdfError}>⚠️ {pdfError}</div>}

            {/* preview do que foi extraído */}
            {pdfResult && (
              <div style={{ marginTop: 16, padding: 16, background: '#f8faff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Dados Extraídos
                </div>
                {[
                  ['Nome',     pdfResult.nome],
                  ['Telefone', pdfResult.telefone],
                  ['Cidade',   pdfResult.cidade],
                  ['LinkedIn', pdfResult.linkedin],
                  ['Resumo',   pdfResult.resumo?.slice(0, 120) + (pdfResult.resumo?.length > 120 ? '...' : '')],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: '#475569', minWidth: 70 }}>{label}:</span>
                    <span style={{ color: '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ABA: EXPERIÊNCIAS ── */}
        {activeTab === 'experiencias' && (
          <div className="card">
            <h3 className="section-title">Adicionar Experiência Profissional</h3>
            <form onSubmit={handleAdicionarExperiencia}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Cargo *</label>
                  <input type="text" value={experiencia.cargo}
                    onChange={e => setExperiencia({ ...experiencia, cargo: e.target.value })}
                    className="form-input" placeholder="Ex: Desenvolvedor Full Stack" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Empresa *</label>
                  <input type="text" value={experiencia.empresa}
                    onChange={e => setExperiencia({ ...experiencia, empresa: e.target.value })}
                    className="form-input" placeholder="Ex: Tech Company" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição das Atividades</label>
                <textarea value={experiencia.descricao}
                  onChange={e => setExperiencia({ ...experiencia, descricao: e.target.value })}
                  className="form-textarea" rows="4"
                  placeholder="Descreva suas principais responsabilidades e conquistas..." />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Data de Início *</label>
                  {/* ← FIX: type="month" → "YYYY-MM" → convertido em monthToDate antes de enviar */}
                  <input type="month" value={experiencia.data_inicio}
                    onChange={e => setExperiencia({ ...experiencia, data_inicio: e.target.value })}
                    className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Término</label>
                  <input type="month" value={experiencia.data_fim}
                    onChange={e => setExperiencia({ ...experiencia, data_fim: e.target.value })}
                    className="form-input" disabled={experiencia.atual} />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={experiencia.atual}
                    onChange={e => setExperiencia({ ...experiencia, atual: e.target.checked, data_fim: '' })} />
                  <span>Trabalho aqui atualmente</span>
                </label>
              </div>

              <button type="submit" className="btn btn-secondary btn-full" disabled={loading}>
                {loading ? 'Adicionando...' : '➕ Adicionar Experiência'}
              </button>
            </form>
          </div>
        )}

        {/* ── ABA: FORMAÇÃO ── */}
        {activeTab === 'formacao' && (
          <div className="card">
            <h3 className="section-title">Adicionar Formação Acadêmica</h3>
            <form onSubmit={handleAdicionarFormacao}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Instituição *</label>
                  <input type="text" value={formacao.instituicao}
                    onChange={e => setFormacao({ ...formacao, instituicao: e.target.value })}
                    className="form-input" placeholder="Ex: Universidade Federal" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Curso *</label>
                  <input type="text" value={formacao.curso}
                    onChange={e => setFormacao({ ...formacao, curso: e.target.value })}
                    className="form-input" placeholder="Ex: Ciência da Computação" required />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Nível *</label>
                  <select value={formacao.nivel}
                    onChange={e => setFormacao({ ...formacao, nivel: e.target.value })}
                    className="form-select" required>
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
                  <select value={formacao.situacao}
                    onChange={e => setFormacao({ ...formacao, situacao: e.target.value })}
                    className="form-select" required>
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
                  {/* ← FIX: convertido em monthToDate antes de enviar */}
                  <input type="month" value={formacao.data_inicio}
                    onChange={e => setFormacao({ ...formacao, data_inicio: e.target.value })}
                    className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Conclusão</label>
                  <input type="month" value={formacao.data_conclusao}
                    onChange={e => setFormacao({ ...formacao, data_conclusao: e.target.value })}
                    className="form-input" />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary btn-full" disabled={loading}>
                {loading ? 'Adicionando...' : '➕ Adicionar Formação'}
              </button>
            </form>
          </div>
        )}

        {/* ── ABA: HABILIDADES ── */}
        {activeTab === 'habilidades' && (
          <div className="card">
            <h3 className="section-title">Adicionar Habilidade</h3>
            <form onSubmit={handleAdicionarHabilidade}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Habilidade *</label>
                  <input type="text" value={habilidade.nome}
                    onChange={e => setHabilidade({ ...habilidade, nome: e.target.value })}
                    className="form-input" placeholder="Ex: JavaScript, Excel, Liderança" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nível</label>
                  <select value={habilidade.nivel}
                    onChange={e => setHabilidade({ ...habilidade, nivel: e.target.value })}
                    className="form-select">
                    <option value="basico">Básico</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-secondary btn-full" disabled={loading}>
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
