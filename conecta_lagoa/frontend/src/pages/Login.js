import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CL_BLUE   = '#1a3a8f';
const CL_ORANGE = '#e07b00';

const Login = ({ tipo: tipoProp }) => {
  const [formData, setFormData] = useState({ email:'', senha:'', tipo: tipoProp || 'candidato' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await login(formData.email, formData.senha, formData.tipo);
    if (result.success) {
      navigate(formData.tipo === 'candidato' ? '/candidato/dashboard' : '/empresa/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const isEmpresa = formData.tipo === 'empresa';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes clFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .cl-login * { box-sizing:border-box; }
        .cl-input:focus { outline:none; border-color:${CL_BLUE} !important; box-shadow:0 0 0 3px rgba(26,58,143,0.1); }
        .cl-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(26,58,143,0.35) !important; }
        .cl-submit:disabled { opacity:0.6; cursor:not-allowed; }
        @media (max-width: 768px) { .cl-login-grid { grid-template-columns: 1fr !important; } .cl-login-left { display: none !important; } }
      `}</style>

      <div className="cl-login" style={{ minHeight:'calc(100vh - 64px)', display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:"'DM Sans', sans-serif" }} >

        {/* ── Esquerda: branding ── */}
        <div className="cl-login-left" style={{ background:`linear-gradient(145deg, ${CL_BLUE} 0%, #0f2460 55%, #1a1a2e 100%)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 52px', color:'white', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(224,123,0,0.12)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-80, left:-40, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:1, maxWidth:360, animation:'clFadeUp 0.6s ease' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:600, marginBottom:32 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }}/>
              Plataforma #1 em Lagoa Vermelha e região
            </div>
            <h2 style={{ fontFamily:"'Sora', sans-serif", fontSize:34, fontWeight:800, lineHeight:1.2, marginBottom:14 }}>
              {isEmpresa ? <>Gerencie seus <span style={{ color:CL_ORANGE }}>talentos</span><br/>em um só lugar</> : <>Encontre sua próxima <span style={{ color:CL_ORANGE }}>oportunidade</span></>}
            </h2>
            <p style={{ fontSize:14, opacity:0.75, lineHeight:1.7, marginBottom:36 }}>
              {isEmpresa ? 'Dashboard completo com funil de recrutamento, candidatos em tempo real e relatórios estratégicos.' : 'Candidate-se a vagas locais, acompanhe suas candidaturas e seja encontrado pelas melhores empresas da região.'}
            </p>
            {(isEmpresa
              ? ['Funil CRM com pipeline visual','KPIs e relatórios em tempo real','Agenda e lembretes automáticos','Banco de talentos inteligente']
              : ['Vagas atualizadas diariamente','Candidate-se com 1 clique','Acompanhe suas candidaturas','Seja encontrado por empresas']
            ).map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, fontSize:13, opacity:0.85, animation:`clFadeUp 0.5s ease ${0.1+i*0.07}s both` }}>
                <div style={{ width:20, height:20, borderRadius:5, background:CL_ORANGE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, flexShrink:0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Direita: formulário ── */}
        <div style={{ background:'#f4f6fb', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 40px' }}>
          <div style={{ width:'100%', maxWidth:400, animation:'clFadeUp 0.5s ease 0.1s both' }}>
            <h3 style={{ fontFamily:"'Sora', sans-serif", fontSize:26, fontWeight:800, color:'#1a1f36', marginBottom:4 }}>Bem-vindo de volta</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:26 }}>Acesse sua conta para continuar</p>

            {/* Toggle candidato/empresa */}
            {!tipoProp && (
              <div style={{ display:'flex', gap:5, background:'#e8ecf4', borderRadius:12, padding:5, marginBottom:22 }}>
                {[{val:'candidato',label:'👤 Candidato'},{val:'empresa',label:'🏢 Empresa'}].map(opt => (
                  <button key={opt.val} type="button" onClick={() => setFormData({...formData, tipo:opt.val})} style={{ flex:1, padding:'10px 0', border:'none', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans', sans-serif", background: formData.tipo===opt.val ? 'white' : 'transparent', color: formData.tipo===opt.val ? CL_BLUE : '#6b7280', boxShadow: formData.tipo===opt.val ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition:'all 0.2s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ background:'white', borderRadius:20, padding:30, boxShadow:'0 4px 24px rgba(26,58,143,0.08)', border:'1px solid #e8ecf4' }}>
              {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>⚠️ {error}</div>}
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>E-mail</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="seu@email.com" className="cl-input" style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #e8ecf4', fontSize:14, fontFamily:"'DM Sans', sans-serif", color:'#1a1f36', background:'#fafbff', transition:'border-color 0.2s' }}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Senha</label>
                  <input type="password" name="senha" required value={formData.senha} onChange={handleChange} placeholder="••••••••" className="cl-input" style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1.5px solid #e8ecf4', fontSize:14, fontFamily:"'DM Sans', sans-serif", color:'#1a1f36', background:'#fafbff', transition:'border-color 0.2s' }}/>
                </div>
                <div style={{ textAlign:'right', marginTop:-6 }}>
                  <Link to={`/esqueceu-senha?tipo=${formData.tipo}`} style={{ fontSize:12, color:CL_BLUE, textDecoration:'none', fontWeight:500 }}>Esqueceu a senha?</Link>
                </div>
                <button type="submit" disabled={loading} className="cl-submit" style={{ width:'100%', padding:'13px', background:`linear-gradient(135deg, ${CL_BLUE}, #2d52c4)`, color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans', sans-serif", boxShadow:'0 4px 16px rgba(26,58,143,0.25)', transition:'all 0.2s', marginTop:4 }}>
                  {loading ? 'Entrando...' : `Entrar como ${formData.tipo === 'empresa' ? 'Empresa' : 'Candidato'}`}
                </button>
              </form>
            </div>

            <p style={{ textAlign:'center', fontSize:13, color:'#6b7280', marginTop:20 }}>
              Não tem conta?{' '}
              <Link to={formData.tipo==='empresa' ? '/empresa/registro' : '/candidato/registro'} style={{ color:CL_BLUE, fontWeight:600, textDecoration:'none' }}>Cadastre-se grátis</Link>
            </p>
            <p style={{ textAlign:'center', marginTop:8 }}>
              <Link to="/" style={{ fontSize:12, color:'#9ca3af', textDecoration:'none' }}>← Voltar ao início</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
