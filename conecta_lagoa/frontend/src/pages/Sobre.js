import React from "react";
import { Link } from "react-router-dom";

const Sobre = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .sb-root { font-family: 'DM Sans', sans-serif; color: #1a1f36; }

        /* ── HERO ── */
        .sb-hero {
          position: relative;
          overflow: hidden;
          background: #0d1f5c;
          padding: 100px 32px 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* grade de pontos decorativa */
        .sb-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }
        /* brilho laranja canto direito */
        .sb-hero::after {
          content: '';
          position: absolute;
          right: -120px;
          top: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(224,123,0,0.35) 0%, transparent 70%);
          pointer-events: none;
        }
        .sb-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .sb-hero-left {}
        .sb-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(224,123,0,0.15);
          border: 1px solid rgba(224,123,0,0.3);
          color: #f0a040;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 50px;
          margin-bottom: 24px;
        }
        .sb-hero-eyebrow::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #e07b00;
        }
        .sb-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          font-weight: 700;
          color: white;
          line-height: 1.1;
          margin: 0 0 20px;
        }
        .sb-hero-title span { color: #e07b00; }
        .sb-hero-desc {
          font-size: 16px;
          line-height: 1.75;
          color: rgba(255,255,255,0.72);
          margin: 0 0 36px;
          max-width: 300px;
        }
        .sb-hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #e07b00;
          color: white;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(224,123,0,0.4);
        }
        .sb-hero-cta:hover {
          background: #c96e00;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(224,123,0,0.5);
        }
        .sb-hero-cta svg { transition: transform 0.2s; }
        .sb-hero-cta:hover svg { transform: translateX(4px); }

        /* Cards de stats no hero */
        .sb-hero-right {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sb-stat-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 24px 20px;
          backdrop-filter: blur(8px);
          transition: background 0.2s, border-color 0.2s;
        }
        .sb-stat-card:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(224,123,0,0.3);
        }
        .sb-stat-card:first-child {
          grid-column: span 2;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .sb-stat-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(224,123,0,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: #e07b00;
        }
        .sb-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: white;
          line-height: 1;
        }
        .sb-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 4px;
          font-weight: 500;
        }

        /* ── MISSÃO / VALORES ── */
        .sb-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 88px 32px;
        }
        .sb-section-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #e07b00;
          margin-bottom: 14px;
        }
        .sb-section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 00;
          color: #0d1f5c;
          margin: 0 0 16px;
          line-height: 1.2;
        }
        .sb-section-sub {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.7;
          max-width: 520px;
          margin: 0;
        }

        /* Bloco missão: 2 colunas */
        .sb-missao-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .sb-missao-visual {
          position: relative;
          height: 320px;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(135deg, #0d1f5c 0%, #1a3a8f 50%, #1e4bb8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sb-missao-visual::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(224,123,0,0.25);
        }
        .sb-missao-svg { position: relative; z-index: 1; }

        /* Valores — 3 cards */
        .sb-valores-bg {
          background: #f8faff;
          border-top: 1px solid #e8edf8;
          border-bottom: 1px solid #e8edf8;
        }
        .sb-valores-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .sb-valor-card {
          background: white;
          border: 1px solid #e8edf8;
          border-radius: 16px;
          padding: 32px 28px;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }
        .sb-valor-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1a3a8f, #e07b00);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s;
        }
        .sb-valor-card:hover {
          border-color: #c5d3f0;
          box-shadow: 0 8px 32px rgba(26,58,143,0.08);
          transform: translateY(-3px);
        }
        .sb-valor-card:hover::before { transform: scaleX(1); }
        .sb-valor-emoji {
          font-size: 2rem;
          margin-bottom: 16px;
          display: block;
        }
        .sb-valor-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0d1f5c;
          margin: 0 0 10px;
        }
        .sb-valor-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.65;
          margin: 0;
        }

        /* ── CTA FINAL ── */
        .sb-cta-section {
          background: linear-gradient(135deg, #0d1f5c 0%, #1a3a8f 100%);
          padding: 80px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .sb-cta-section::before {
          content: '';
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(224,123,0,0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .sb-cta-inner { position: relative; z-index: 1; }
        .sb-cta-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 800;
          color: white;
          margin: 0 0 14px;
        }
        .sb-cta-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.65);
          margin: 0 0 36px;
        }
        .sb-cta-btns {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .sb-cta-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #e07b00; color: white;
          font-weight: 700; font-size: 15px;
          padding: 14px 28px; border-radius: 10px;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(224,123,0,0.4);
        }
        .sb-cta-btn-primary:hover { background: #c96e00; transform: translateY(-2px); }
        .sb-cta-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: white;
          font-weight: 600; font-size: 15px;
          padding: 14px 28px; border-radius: 10px;
          text-decoration: none; transition: all 0.2s;
          border: 1.5px solid rgba(255,255,255,0.3);
        }
        .sb-cta-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.6); }

        /* RESPONSIVE */
        @media (max-width: 860px) {
          .sb-hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .sb-hero-right { display: none; }
          .sb-missao-grid { grid-template-columns: 1fr; }
          .sb-missao-visual { height: 200px; }
          .sb-valores-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .sb-hero { padding: 64px 20px; }
          .sb-section { padding: 56px 20px; }
        }
      `}</style>

      <div className="sb-root">

        {/* ── HERO ── */}
        <section className="sb-hero">
          <div className="sb-hero-inner">
            <div className="sb-hero-left">
              <div className="sb-hero-eyebrow">Plataforma #1 de empregos na região</div>
              <h1 className="sb-hero-title">
                Conectando<br/>
                <span>talentos locais</span><br/>
                com oportunidades
              </h1>
              <p className="sb-hero-desc">
                Nascemos para facilitar a conexão entre você e as melhores oportunidades de trabalho na nossa região. Cada vaga e cada talento têm vez aqui.
              </p>
              <Link to="/registro" className="sb-hero-cta">
                Comece agora
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            <div className="sb-hero-right">
              {/* Card destaque */}
              <div className="sb-stat-card">
                <div className="sb-stat-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <div>
                  <div className="sb-stat-num">500+</div>
                  <div className="sb-stat-label">Candidatos cadastrados</div>
                </div>
              </div>
              <div className="sb-stat-card">
                <div className="sb-stat-icon" style={{background:'rgba(26,58,143,0.25)',color:'#7090e0'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                </div>
                <div>
                  <div className="sb-stat-num">80+</div>
                  <div className="sb-stat-label">Vagas abertas</div>
                </div>
              </div>
              <div className="sb-stat-card">
                <div className="sb-stat-icon" style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <div className="sb-stat-num">200+</div>
                  <div className="sb-stat-label">Contratações realizadas</div>
                </div>
              </div>
              <div className="sb-stat-card">
                <div className="sb-stat-icon" style={{background:'rgba(224,123,0,0.2)',color:'#e07b00'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                </div>
                <div>
                  <div className="sb-stat-num">40+</div>
                  <div className="sb-stat-label">Empresas parceiras</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MISSÃO ── */}
        <section className="sb-section">
          <div className="sb-missao-grid">
            <div>
              <span className="sb-section-tag">Nossa missão</span>
              <h2 className="sb-section-title">Conectar o talento certo com a vaga certa</h2>
              <p className="sb-section-sub">
                Acreditamos que encontrar o emprego ideal deve ser simples, rápido e feito com carinho. Valorizamos os talentos da nossa região e trabalhamos para que cada candidato encontre sua oportunidade.
              </p>
            </div>
            <div className="sb-missao-visual">
              {/* Ilustração SVG de rede de conexões */}
              <svg className="sb-missao-svg" width="240" height="200" viewBox="0 0 240 200" fill="none">
                <circle cx="120" cy="100" r="28" fill="rgba(224,123,0,0.25)" stroke="#e07b00" strokeWidth="2"/>
                <text x="120" y="106" textAnchor="middle" fill="#e07b00" fontSize="14" fontWeight="700">CL</text>
                {/* nós satélite */}
                {[[40,40],[200,40],[200,160],[40,160],[120,18],[120,182]].map(([cx,cy],i)=>(
                  <g key={i}>
                    <line x1="120" y1="100" x2={cx} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3"/>
                    <circle cx={cx} cy={cy} r="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                    <circle cx={cx} cy={cy} r="4" fill={i%2===0?'#e07b00':'rgba(255,255,255,0.7)'}/>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </section>

        {/* ── VALORES ── */}
        <div className="sb-valores-bg">
          <section className="sb-section">
            <div style={{textAlign:'center'}}>
              <span className="sb-section-tag">O que nos guia</span>
              <h2 className="sb-section-title">Nossos valores</h2>
            </div>
            <div className="sb-valores-grid">
              <div className="sb-valor-card">
                <span className="sb-valor-emoji">🤝</span>
                <h3 className="sb-valor-title">Transparência e confiança</h3>
                <p className="sb-valor-desc">Operamos com total clareza para candidatos e empresas, construindo relações duradouras baseadas em honestidade.</p>
              </div>
              <div className="sb-valor-card">
                <span className="sb-valor-emoji">🔗</span>
                <h3 className="sb-valor-title">Conexões que fazem diferença</h3>
                <p className="sb-valor-desc">Cada match que realizamos transforma vidas. Conectamos pessoas com as oportunidades que realmente importam para elas.</p>
              </div>
              <div className="sb-valor-card">
                <span className="sb-valor-emoji">🌟</span>
                <h3 className="sb-valor-title">Valorização do talento local</h3>
                <p className="sb-valor-desc">Acreditamos no potencial da nossa região. Trabalhamos para que os talentos locais sejam reconhecidos e valorizados.</p>
              </div>
            </div>
          </section>
        </div>

        {/* ── CTA FINAL ── */}
        <section className="sb-cta-section">
          <div className="sb-cta-inner">
            <h2 className="sb-cta-title">Pronto para dar o próximo passo?</h2>
            <p className="sb-cta-sub">Junte-se a centenas de candidatos e empresas que já confiam na Conecta Lagoa.</p>
            <div className="sb-cta-btns">
              <Link to="/registro?tipo=candidato" className="sb-cta-btn-primary">
                Sou Candidato
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/registro?tipo=empresa" className="sb-cta-btn-ghost">
                Sou Empresa
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Sobre;