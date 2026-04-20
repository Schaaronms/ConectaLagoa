import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'https://conectalagoa.onrender.com';

/* ── helpers ─────────────────────────────────────── */
const senhaForce = (s) => {
  if (!s) return 0;
  let n = 0;
  if (s.length >= 6) n++;
  if (s.length >= 10) n++;
  if (/[A-Z]/.test(s)) n++;
  if (/[0-9]/.test(s)) n++;
  if (/[^A-Za-z0-9]/.test(s)) n++;
  return n;
};
const FORCE_LABEL = ['', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'];
const FORCE_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
             'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

/* ── styles object ───────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1629 0%, #1a2b5a 50%, #0f1629 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 20px 60px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'fixed', top: '-120px', right: '-120px',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(45,77,224,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'fixed', bottom: '-80px', left: '-80px',
    width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  wrapper: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 480,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 28,
  },
  logoBadge: {
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(135deg, #1A56DB, #2d52c4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 14,
    boxShadow: '0 4px 16px rgba(26,86,219,0.45)',
  },
  logoText: { lineHeight: 1.1 },
  logoName: { fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' },
  logoSub: { fontSize: 10, fontWeight: 600, color: '#60a5fa', letterSpacing: '2px', textTransform: 'uppercase' },

  card: {
    background: '#ffffff',
    borderRadius: 24,
    boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.1)',
    width: '100%',
    padding: '36px 36px 40px',
    animation: 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
  },

  /* Step indicator */
  steps: {
    display: 'flex', alignItems: 'center',
    marginBottom: 28, gap: 0,
  },
  stepCircle: (active, done) => ({
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
    background: done ? '#1A56DB' : active ? '#1A56DB' : '#f0f3fa',
    color: (done || active) ? '#fff' : '#9ca3af',
    border: active ? '2.5px solid #1A56DB' : done ? 'none' : '2px solid #e4e8f0',
    transition: 'all 0.3s ease',
    boxShadow: active ? '0 0 0 5px rgba(26,86,219,0.12)' : 'none',
  }),
  stepLine: (done) => ({
    flex: 1, height: 2,
    background: done ? '#1A56DB' : '#e4e8f0',
    transition: 'background 0.4s ease',
  }),
  stepLabel: (active, done) => ({
    fontSize: 10, fontWeight: 600,
    color: (active || done) ? '#1A56DB' : '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    textAlign: 'center', marginTop: 5,
    transition: 'color 0.3s',
  }),

  cardTitle: { fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4, letterSpacing: '-0.4px' },
  cardSub: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 },

  /* Tipo selector */
  tipoRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 10, marginBottom: 24,
  },
  tipoCard: (active) => ({
    padding: '14px 16px', borderRadius: 14,
    border: active ? '2px solid #1A56DB' : '2px solid #e4e8f0',
    background: active ? '#EFF4FF' : '#f9fafb',
    cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s ease',
    display: 'flex', flexDirection: 'column', gap: 4,
  }),
  tipoIcon: { fontSize: 22, marginBottom: 2 },
  tipoLabel: (active) => ({
    fontSize: 14, fontWeight: 700,
    color: active ? '#1A56DB' : '#374151',
  }),
  tipoDesc: (active) => ({
    fontSize: 11, color: active ? '#4f80e1' : '#9ca3af', lineHeight: 1.4,
  }),

  /* Plan cards */
  planRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 12, marginBottom: 24,
  },
  planCard: (active, featured) => ({
    padding: '18px 16px', borderRadius: 16,
    border: active ? '2px solid #1A56DB' : featured ? '2px solid #e2e8f0' : '2px solid #e4e8f0',
    background: active ? '#EFF4FF' : featured ? '#fafbff' : '#f9fafb',
    cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s ease',
    position: 'relative', overflow: 'hidden',
  }),
  planBadge: {
    position: 'absolute', top: 10, right: 10,
    fontSize: 9, fontWeight: 700, padding: '2px 7px',
    borderRadius: 20, background: '#1A56DB', color: '#fff',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  planName: (active) => ({
    fontSize: 16, fontWeight: 800,
    color: active ? '#1A56DB' : '#111827', marginBottom: 4,
  }),
  planPrice: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  planFeature: { fontSize: 11, color: '#374151', marginBottom: 3, display: 'flex', gap: 6, alignItems: 'flex-start' },

  /* Fields */
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: (err) => ({
    width: '100%', padding: '11px 14px',
    background: err ? '#fff5f5' : '#f4f6fb',
    border: err ? '1.5px solid #ef4444' : '1.5px solid transparent',
    borderRadius: 10, fontSize: 14,
    fontFamily: 'inherit', color: '#111827',
    outline: 'none', transition: 'all 0.2s',
    boxSizing: 'border-box',
  }),
  hint: (ok) => ({ fontSize: 11, fontWeight: 500, color: ok ? '#22c55e' : '#ef4444' }),

  checkbox: { display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 18 },
  checkboxBox: (checked) => ({
    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
    border: checked ? 'none' : '2px solid #d1d5db',
    background: checked ? '#1A56DB' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s',
  }),

  /* Buttons */
  btnPrimary: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #1A56DB, #2d52c4)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 16px rgba(26,86,219,0.35)',
  },
  btnBack: {
    width: '100%', padding: '12px',
    background: 'transparent', color: '#6b7280',
    border: '1.5px solid #e4e8f0', borderRadius: 12,
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer', transition: 'all 0.2s', marginTop: 8,
  },

  divider: { textAlign: 'center', position: 'relative', margin: '20px 0' },
  dividerLine: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    height: 1, background: '#e8edf7',
  },
  dividerText: {
    background: '#fff', padding: '0 12px',
    position: 'relative', fontSize: 12, color: '#9ca3af', fontWeight: 500,
  },

  btnGoogle: {
    width: '100%', padding: '12px 16px',
    background: '#fff', border: '1.5px solid #d8dff0', borderRadius: 12,
    fontSize: 14, fontWeight: 600, color: '#111827',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, transition: 'all 0.2s', fontFamily: 'inherit', marginBottom: 4,
  },

  alert: { display: 'flex', alignItems: 'center', gap: 9, background: '#fef2f2',
    border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10,
    padding: '11px 14px', fontSize: 13, fontWeight: 500, marginBottom: 18,
  },
  footer: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 22, textAlign: 'center' },
  footerLink: { color: '#60a5fa', fontWeight: 700, textDecoration: 'none' },
  backLink: { display: 'inline-block', marginTop: 10, fontSize: 13,
    color: 'rgba(255,255,255,0.4)', textDecoration: 'none' },
};

/* ─── Sub-components ─────────────────────────────── */
function StrengthBar({ value }) {
  if (!value) return null;
  const force = senhaForce(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99,
            background: i <= force ? FORCE_COLOR[force] : '#e2e8f0',
            transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: FORCE_COLOR[force], whiteSpace: 'nowrap' }}>
        {FORCE_LABEL[force]}
      </span>
    </div>
  );
}

function FieldInput({ label, name, type = 'text', value, onChange, onBlur, placeholder, error, hint, children }) {
  const [focused, setFocused] = useState(false);
  const inputStyle = {
    ...S.input(!!error),
    ...(focused ? { background: '#fff', border: '1.5px solid #1A56DB', boxShadow: '0 0 0 3px rgba(26,86,219,0.1)' } : {}),
  };
  return (
    <div style={S.fieldGroup}>
      {label && <label style={S.label}>{label}</label>}
      {children || (
        <input
          name={name} type={type} value={value}
          onChange={onChange} onBlur={onBlur || (() => setFocused(false))}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
        />
      )}
      {error && <span style={S.hint(false)}>{error}</span>}
      {hint && !error && <span style={S.hint(true)}>{hint}</span>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────── */
export default function Registro() {
  const [searchParams] = useSearchParams();
  const tipoUrl = searchParams.get('tipo');
  const { registroCandidato, registroEmpresa } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState(tipoUrl || 'candidato');
  const [plano, setPlano] = useState('free');
  const [termos, setTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  const [form, setForm] = useState({
    nome: '', email: '', cnpj: '',
    senha: '', confirmarSenha: '',
    telefone: '', cidade: '', estado: '',
  });

  useEffect(() => { if (tipoUrl) setTipo(tipoUrl); }, [tipoUrl]);

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };

  const checkEmail = async () => {
    if (!form.email) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/check-email?email=${encodeURIComponent(form.email)}`);
      const data = await res.json();
      setEmailError(data.exists ? 'Este e-mail já está cadastrado' : '');
    } catch { setEmailError(''); }
  };

  const totalSteps = tipo === 'empresa' ? 3 : 2;

  const stepLabels = tipo === 'empresa'
    ? ['Conta', 'Acesso', 'Plano']
    : ['Conta', 'Acesso'];

  /* ── validate & advance ── */
  const next = () => {
    setError('');
    if (step === 1) {
      if (!form.nome.trim()) return setError('Informe seu nome');
      if (!form.email.trim()) return setError('Informe seu e-mail');
      if (!/\S+@\S+\.\S+/.test(form.email)) return setError('E-mail inválido');
      if (emailError) return setError('Corrija o e-mail antes de continuar');
      if (tipo === 'empresa' && !form.cnpj.trim()) return setError('CNPJ é obrigatório');
    }
    if (step === 2) {
      if (form.senha.length < 6) return setError('Senha deve ter ao menos 6 caracteres');
      if (form.senha !== form.confirmarSenha) return setError('As senhas não coincidem');
    }
    setStep(s => s + 1);
  };

  const back = () => { setError(''); setStep(s => s - 1); };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!termos) return setError('Você precisa aceitar os termos para continuar');
    setLoading(true);
    setError('');

    const payload = {
      email: form.email, senha: form.senha,
      telefone: form.telefone, cidade: form.cidade, estado: form.estado,
    };

    let result;
    if (tipo === 'candidato') {
      payload.nome_completo = form.nome;
      result = await registroCandidato(payload);
    } else {
      payload.nome = form.nome;
      payload.cnpj = form.cnpj;
      payload.plano = plano;
      result = await registroEmpresa(payload);
    }

    if (result.success) {
      navigate(tipo === 'candidato' ? '/candidato/onboarding' : '/empresa/dashboard');
    } else {
      setError(result.message || 'Erro ao criar conta. Tente novamente.');
    }
    setLoading(false);
  };

  /* ── step indicator ── */
  const StepIndicator = () => (
    <div style={{ marginBottom: 28 }}>
      <div style={S.steps}>
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <React.Fragment key={num}>
              {i > 0 && <div style={S.stepLine(done || step > num)} />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={S.stepCircle(active, done)}>
                  {done ? '✓' : num}
                </div>
                <span style={S.stepLabel(active, done)}>{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  /* ── STEP 1: tipo + nome + email ── */
  const renderStep1 = () => (
    <>
      <div style={S.cardTitle}>Criar sua conta</div>
      <div style={S.cardSub}>Junte-se à plataforma de empregos de Lagoa Vermelha</div>

      {/* Tipo */}
      <div style={S.tipoRow}>
        {[
          { id: 'candidato', icon: '👤', label: 'Candidato', desc: 'Busco novas oportunidades' },
          { id: 'empresa', icon: '🏢', label: 'Empresa', desc: 'Preciso contratar talentos' },
        ].map(t => (
          <div key={t.id} style={S.tipoCard(tipo === t.id)} onClick={() => { setTipo(t.id); setError(''); }}>
            <span style={S.tipoIcon}>{t.icon}</span>
            <div style={S.tipoLabel(tipo === t.id)}>{t.label}</div>
            <div style={S.tipoDesc(tipo === t.id)}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Google */}
      <button type="button" style={S.btnGoogle}
        onClick={() => { window.location.href = `${API_URL}/api/auth/google`; }}>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar com Google
      </button>

      <div style={S.divider}>
        <div style={S.dividerLine} />
        <span style={S.dividerText}>ou cadastre-se com e-mail</span>
      </div>

      {error && <div style={S.alert}><span>⚠</span>{error}</div>}

      <FieldInput label={tipo === 'candidato' ? 'Nome Completo' : 'Nome da Empresa'}
        name="nome" value={form.nome} onChange={set('nome')}
        placeholder={tipo === 'candidato' ? 'Seu nome completo' : 'Razão social ou nome fantasia'} />

      <FieldInput label="E-mail" name="email" type="email"
        value={form.email} onChange={set('email')} onBlur={checkEmail}
        placeholder="seu@email.com"
        error={emailError}
        hint={form.email && !emailError ? '' : undefined} />

      {tipo === 'empresa' && (
        <FieldInput label="CNPJ" name="cnpj" value={form.cnpj} onChange={set('cnpj')}
          placeholder="00.000.000/0000-00" />
      )}

      <button style={S.btnPrimary} onClick={next}>
        Continuar <span>→</span>
      </button>
    </>
  );

  /* ── STEP 2: senha + contato ── */
  const renderStep2 = () => {
    const force = senhaForce(form.senha);
    return (
      <>
        <div style={S.cardTitle}>Crie sua senha</div>
        <div style={S.cardSub}>Escolha uma senha segura para proteger sua conta</div>

        {error && <div style={S.alert}><span>⚠</span>{error}</div>}

        <div style={S.fieldGroup}>
          <label style={S.label}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input
              name="senha" type={showSenha ? 'text' : 'password'}
              value={form.senha} onChange={set('senha')}
              placeholder="Mínimo 6 caracteres"
              style={{ ...S.input(false), paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowSenha(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>
              {showSenha ? '🙈' : '👁'}
            </button>
          </div>
          <StrengthBar value={form.senha} />
        </div>

        <FieldInput label="Confirmar Senha" name="confirmarSenha" type="password"
          value={form.confirmarSenha} onChange={set('confirmarSenha')}
          placeholder="Repita a senha"
          error={form.confirmarSenha && form.senha !== form.confirmarSenha ? 'As senhas não coincidem' : undefined}
          hint={form.confirmarSenha && form.senha === form.confirmarSenha ? '✓ Senhas coincidem' : undefined} />

        <div style={S.fieldRow}>
          <FieldInput label="Telefone" name="telefone" type="tel"
            value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
          <FieldInput label="Cidade" name="cidade"
            value={form.cidade} onChange={set('cidade')} placeholder="Lagoa Vermelha" />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Estado</label>
          <select name="estado" value={form.estado} onChange={set('estado')}
            style={{ ...S.input(false),
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
              backgroundSize: 16, paddingRight: 36, appearance: 'none', cursor: 'pointer',
            }}>
            <option value="">Selecione o estado</option>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.btnBack, flex: '0 0 auto', width: 44, borderRadius: 12 }} onClick={back}>←</button>
          <button style={{ ...S.btnPrimary, flex: 1, margin: 0 }} onClick={next}>
            Continuar →
          </button>
        </div>
      </>
    );
  };

  /* ── STEP 3 (empresa): plano + termos ── */
  const renderStep3Empresa = () => (
    <>
      <div style={S.cardTitle}>Escolha seu plano</div>
      <div style={S.cardSub}>Comece grátis ou potencialize seus resultados com o Premium</div>

      {error && <div style={S.alert}><span>⚠</span>{error}</div>}

      <div style={S.planRow}>
        {/* Free */}
        <div style={S.planCard(plano === 'free', false)} onClick={() => setPlano('free')}>
          <div style={S.planName(plano === 'free')}>Free</div>
          <div style={S.planPrice}>Sempre gratuito</div>
          {['Até 2 vagas ativas','5 candidatos/vaga','Painel básico','Suporte por e-mail'].map(f => (
            <div key={f} style={S.planFeature}>
              <span style={{ color: '#10b981', flexShrink: 0 }}>✓</span> {f}
            </div>
          ))}
        </div>

        {/* Premium */}
        <div style={S.planCard(plano === 'premium', true)} onClick={() => setPlano('premium')}>
          <div style={S.planBadge}>Popular</div>
          <div style={S.planName(plano === 'premium')}>Premium</div>
          <div style={S.planPrice}>R$ 89/mês</div>
          {['Vagas ilimitadas','Candidatos ilimitados','Copiloto IA','Indicadores RH','Suporte prioritário'].map(f => (
            <div key={f} style={S.planFeature}>
              <span style={{ color: '#1A56DB', flexShrink: 0 }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Termos */}
      <div style={S.checkbox} onClick={() => setTermos(p => !p)}>
        <div style={S.checkboxBox(termos)}>
          {termos && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
        </div>
        <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
          Li e aceito os{' '}
          <a href="/termos" target="_blank" style={{ color: '#1A56DB', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
            Termos de Uso
          </a>
          {' '}e a{' '}
          <a href="/privacidade" target="_blank" style={{ color: '#1A56DB', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
            Política de Privacidade
          </a>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...S.btnBack, flex: '0 0 auto', width: 44, borderRadius: 12 }} onClick={back}>←</button>
        <button
          style={{ ...S.btnPrimary, flex: 1, margin: 0, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'clSpin 0.7s linear infinite', flexShrink: 0 }} /> Criando...</> : 'Criar conta gratuita'}
        </button>
      </div>
    </>
  );

  /* ── STEP 2 final (candidato): termos ── */
  const renderStep2Candidato = () => (
    <>
      <div style={S.cardTitle}>Quase lá!</div>
      <div style={S.cardSub}>Confirme seus dados e aceite os termos para criar sua conta</div>

      {error && <div style={S.alert}><span>⚠</span>{error}</div>}

      {/* Resumo */}
      <div style={{ background: '#f4f6fb', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
        {[
          { label: 'Nome', value: form.nome },
          { label: 'E-mail', value: form.email },
          { label: 'Telefone', value: form.telefone || '—' },
          { label: 'Cidade', value: form.cidade ? `${form.cidade}${form.estado ? ` / ${form.estado}` : ''}` : '—' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>{row.label}</span>
            <span style={{ color: '#111827', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Termos */}
      <div style={S.checkbox} onClick={() => setTermos(p => !p)}>
        <div style={S.checkboxBox(termos)}>
          {termos && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
        </div>
        <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
          Li e aceito os{' '}
          <a href="/termos" target="_blank" style={{ color: '#1A56DB', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
            Termos de Uso
          </a>
          {' '}e a{' '}
          <a href="/privacidade" target="_blank" style={{ color: '#1A56DB', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
            Política de Privacidade
          </a>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...S.btnBack, flex: '0 0 auto', width: 44, borderRadius: 12 }} onClick={back}>←</button>
        <button
          style={{ ...S.btnPrimary, flex: 1, margin: 0, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit} disabled={loading}>
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'clSpin 0.7s linear infinite', flexShrink: 0 }} /> Criando...</>
            : 'Criar minha conta'}
        </button>
      </div>
    </>
  );

  /* ── render ── */
  const renderContent = () => {
    if (step === 1) return renderStep1();
    if (step === 2) {
      if (tipo === 'empresa') return renderStep2();
      // candidato step 2: senha+contato, but we need to intercept "Continuar"
      return renderStep2Wrapper();
    }
    if (step === 3 && tipo === 'empresa') return renderStep3Empresa();
    if (step === 99) return renderStep2Candidato();
    return null;
  };

  // Wrapper for candidato step 2 to override next button behavior
  const renderStep2Wrapper = () => {
    const force = senhaForce(form.senha);
    return (
      <>
        <div style={S.cardTitle}>Crie sua senha</div>
        <div style={S.cardSub}>Escolha uma senha segura para proteger sua conta</div>

        {error && <div style={S.alert}><span>⚠</span>{error}</div>}

        <div style={S.fieldGroup}>
          <label style={S.label}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input name="senha" type={showSenha ? 'text' : 'password'}
              value={form.senha} onChange={set('senha')}
              placeholder="Mínimo 6 caracteres"
              style={{ ...S.input(false), paddingRight: 40 }} />
            <button type="button" onClick={() => setShowSenha(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>
              {showSenha ? '🙈' : '👁'}
            </button>
          </div>
          <StrengthBar value={form.senha} />
        </div>

        <FieldInput label="Confirmar Senha" name="confirmarSenha" type="password"
          value={form.confirmarSenha} onChange={set('confirmarSenha')}
          placeholder="Repita a senha"
          error={form.confirmarSenha && form.senha !== form.confirmarSenha ? 'As senhas não coincidem' : undefined}
          hint={form.confirmarSenha && form.senha === form.confirmarSenha ? '✓ Senhas coincidem' : undefined} />

        <div style={S.fieldRow}>
          <FieldInput label="Telefone" name="telefone" type="tel"
            value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
          <FieldInput label="Cidade" name="cidade"
            value={form.cidade} onChange={set('cidade')} placeholder="Lagoa Vermelha" />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Estado</label>
          <select name="estado" value={form.estado} onChange={set('estado')}
            style={{ ...S.input(false),
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
              backgroundSize: 16, paddingRight: 36, appearance: 'none', cursor: 'pointer',
            }}>
            <option value="">Selecione o estado</option>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...S.btnBack, flex: '0 0 auto', width: 44, borderRadius: 12 }} onClick={back}>←</button>
          <button style={{ ...S.btnPrimary, flex: 1, margin: 0 }} onClick={() => {
            setError('');
            if (form.senha.length < 6) return setError('Senha deve ter ao menos 6 caracteres');
            if (form.senha !== form.confirmarSenha) return setError('As senhas não coincidem');
            setStep(99);
          }}>
            Revisar e finalizar →
          </button>
        </div>
      </>
    );
  };

  const displayStep = step === 99 ? totalSteps : step;

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes clSpin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, select, textarea, button { font-family: 'DM Sans', system-ui, sans-serif !important; }
      `}</style>

      <div style={S.bgGlow1} />
      <div style={S.bgGlow2} />

      <div style={S.wrapper}>
        {/* Logo */}
        <div style={S.logoRow}>
          <div style={S.logoBadge}>CL</div>
          <div style={S.logoText}>
            <div style={S.logoName}>Conecta Lagoa</div>
            <div style={S.logoSub}>Plataforma de Empregos</div>
          </div>
        </div>

        {/* Card */}
        <div style={S.card} key={step}>
          <StepIndicator />
          {renderContent()}
        </div>

        <p style={S.footer}>
          Já tem conta?{' '}
          <Link to="/login" style={S.footerLink}>Fazer login</Link>
        </p>
        <Link to="/" style={S.backLink}>← Voltar ao início</Link>
      </div>
    </div>
  );
}
