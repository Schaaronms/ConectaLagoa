import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { value: "2.400+", label: "Candidatos" },
  { value: "380+", label: "Empresas" },
  { value: "1.200+", label: "Vagas Publicadas" },
  { value: "94%", label: "Taxa de Satisfação" },
];

const HOW_IT_WORKS = [
  {
    icon: "👤",
    title: "Crie seu Perfil",
    desc: "Cadastre-se e monte um perfil profissional completo com suas habilidades e experiências.",
  },
  {
    icon: "🔍",
    title: "Busque Vagas",
    desc: "Explore centenas de vagas de empresas da nossa região filtradas para o seu perfil.",
  },
  {
    icon: "🚀",
    title: "Candidate-se",
    desc: "Com um clique candidate-se e acompanhe o status de cada processo seletivo.",
  },
];

const FEATURED_COMPANIES = [
  { name: "Infotech", area: "Tecnologia", vagas: 12 },
  { name: "Lagoa Comércio", area: "Varejo", vagas: 8 },
  { name: "Construir Engenharia", area: "Construção", vagas: 5 },
  { name: "Saúde Clínica", area: "Saúde", vagas: 9 },
];

const RECENT_JOBS = [
  { title: "Analista de Marketing", company: "Infotech", type: "CLT", time: "2h" },
  { title: "Assistente Administrativo", company: "Lagoa Comércio", type: "PJ", time: "5h" },
  { title: "Desenvolvedor Web", company: "Construir", type: "CLT", time: "1d" },
  { title: "Enfermeiro(a)", company: "Saúde Clínica", type: "CLT", time: "2d" },
  { title: "Analista de Dados", company: "Infotech", type: "Estágio", time: "3d" },
  { title: "Vendedor(a) Externo", company: "Lagoa Comércio", type: "CLT", time: "4d" },
];

const TESTIMONIALS = [
  {
    name: "Julia Oliveira",
    role: "Assistente Administrativa",
    text: "Encontrei meu emprego atual em menos de 2 semanas pelo Conecta Lagoa. A plataforma é incrível e muito fácil de usar!",
    avatar: "JO",
  },
  {
    name: "Carlos Mendes",
    role: "Desenvolvedor Web",
    text: "Como empresa, conseguimos contratar 3 profissionais ótimos. O processo é ágil e os candidatos são qualificados.",
    avatar: "CM",
  },
  {
    name: "Ana Paula",
    role: "Analista de Marketing",
    text: "A melhor plataforma de vagas da região! Conecta profissionais locais com empresas que realmente precisam deles.",
    avatar: "AP",
  },
];

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  const numeric = parseInt(value.replace(/\D/g, ""));
  const suffix = value.replace(/[0-9]/g, "");

  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = numeric / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setCount(numeric);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [numeric]);

  return <span>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, isCandidato, isEmpresa } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [jobFilter, setJobFilter] = useState("Todos");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCandidato = () => {
    if (!user) navigate('/registro');
    else if (isCandidato()) navigate('/candidato/dashboard');
    else navigate('/registro');
  };

  const handleEmpresa = () => {
    if (!user) navigate('/registro');
    else if (isEmpresa()) navigate('/empresa/dashboard');
    else navigate('/registro');
  };

  const styles = {
    root: {
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      margin: 0,
      padding: 0,
      color: "#1a1a2e",
      background: "#f8f9fc",
    },
    hero: {
      position: "relative",
      minHeight: "92vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0d1f5c 0%, #1a3a8f 40%, #c45e00 80%, #e07b00 100%)",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: `
        radial-gradient(ellipse 60% 50% at 20% 50%, rgba(26,58,143,0.6) 0%, transparent 70%),
        radial-gradient(ellipse 50% 60% at 80% 50%, rgba(224,123,0,0.5) 0%, transparent 70%)
      `,
    },
    heroGrid: {
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
    },
    heroContent: {
      position: "relative",
      zIndex: 2,
      textAlign: "center",
      maxWidth: 800,
      padding: "0 24px",
    },
    heroBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.3)",
      borderRadius: 100,
      padding: "6px 16px",
      marginBottom: 28,
      color: "white",
      fontSize: 13,
      fontWeight: 500,
      backdropFilter: "blur(8px)",
    },
    heroBadgeDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#4ade80",
      boxShadow: "0 0 8px #4ade80",
      animation: "pulse 2s infinite",
    },
    heroTitle: {
      fontSize: "clamp(36px, 6vw, 68px)",
      fontWeight: 900,
      color: "white",
      lineHeight: 1.1,
      marginBottom: 20,
      letterSpacing: "-1px",
    },
    heroHighlight: {
      background: "linear-gradient(90deg, #fbbf24, #e07b00)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    heroDesc: {
      fontSize: 18,
      color: "rgba(255,255,255,0.8)",
      marginBottom: 40,
      lineHeight: 1.6,
    },
    heroButtons: {
      display: "flex",
      gap: 16,
      justifyContent: "center",
      flexWrap: "wrap",
    },
    heroBtnPrimary: {
      padding: "16px 36px",
      borderRadius: 12,
      border: "none",
      background: "white",
      color: "#1a3a8f",
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      transition: "transform 0.2s",
    },
    heroBtnOutline: {
      padding: "16px 36px",
      borderRadius: 12,
      border: "2px solid rgba(255,255,255,0.6)",
      background: "rgba(255,255,255,0.1)",
      color: "white",
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
      backdropFilter: "blur(8px)",
      transition: "all 0.2s",
    },
    heroScroll: {
      position: "absolute",
      bottom: 32,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      color: "rgba(255,255,255,0.6)",
      fontSize: 12,
      animation: "bounce 2s infinite",
    },
    statsBar: {
      background: "white",
      boxShadow: "0 4px 30px rgba(26,58,143,0.1)",
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    statItem: {
      padding: "28px 56px",
      textAlign: "center",
      flex: "1 1 200px",
    },
    statValue: {
      fontSize: 36,
      fontWeight: 900,
      color: "#1a3a8f",
      lineHeight: 1,
      marginBottom: 6,
    },
    statLabel: { fontSize: 13, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 },
    section: { padding: "80px 40px", maxWidth: 1200, margin: "0 auto" },
    sectionHeader: { textAlign: "center", marginBottom: 56 },
    sectionEyebrow: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: "#e07b00",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: "clamp(28px, 4vw, 42px)",
      fontWeight: 800,
      color: "#1a1a2e",
      marginBottom: 16,
      lineHeight: 1.2,
    },
    sectionDesc: { fontSize: 16, color: "#666", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 },
    howGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 28,
    },
    howCard: {
      background: "white",
      borderRadius: 20,
      padding: "40px 32px",
      boxShadow: "0 4px 24px rgba(26,58,143,0.06)",
      border: "1px solid #f0f4ff",
      transition: "transform 0.2s, box-shadow 0.2s",
      position: "relative",
      overflow: "hidden",
    },
    howNumber: {
      position: "absolute",
      top: 20,
      right: 24,
      fontSize: 64,
      fontWeight: 900,
      color: "#f0f4ff",
      lineHeight: 1,
    },
    howIcon: { fontSize: 40, marginBottom: 20 },
    howTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 },
    howDesc: { fontSize: 14, color: "#666", lineHeight: 1.7 },
    companiesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 20,
    },
    companyCard: {
      background: "white",
      borderRadius: 16,
      padding: "28px 24px",
      boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
      border: "1px solid #f0f4ff",
      display: "flex",
      alignItems: "center",
      gap: 16,
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    },
    companyAvatar: {
      width: 50,
      height: 50,
      borderRadius: 12,
      background: "linear-gradient(135deg, #1a3a8f, #2d52c4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 800,
      fontSize: 18,
    },
    companyName: { fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 4 },
    companyArea: { fontSize: 12, color: "#888" },
    companyVagas: {
      marginLeft: "auto",
      background: "#f0f4ff",
      color: "#1a3a8f",
      borderRadius: 8,
      padding: "4px 10px",
      fontSize: 12,
      fontWeight: 700,
    },
    jobsSection: {
      background: "linear-gradient(180deg, #f8f9fc 0%, #eef2ff 100%)",
      padding: "80px 0",
    },
    jobFilters: {
      display: "flex",
      gap: 10,
      justifyContent: "center",
      marginBottom: 40,
      flexWrap: "wrap",
    },
    jobFilterBtn: (active) => ({
      padding: "8px 20px",
      borderRadius: 100,
      border: active ? "none" : "1px solid #dde2f0",
      background: active ? "linear-gradient(135deg, #1a3a8f, #2d52c4)" : "white",
      color: active ? "white" : "#666",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    jobsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: 20,
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 40px",
    },
    jobCard: {
      background: "white",
      borderRadius: 16,
      padding: "24px",
      boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
      border: "1px solid #f0f4ff",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    },
    jobTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    jobTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 },
    jobCompany: { fontSize: 13, color: "#888" },
    jobBadge: (type) => ({
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: type === "CLT" ? "#dcfce7" : type === "PJ" ? "#fef3c7" : "#f3e8ff",
      color: type === "CLT" ? "#16a34a" : type === "PJ" ? "#d97706" : "#9333ea",
    }),
    jobTime: { fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 4 },
    jobApplyBtn: {
      width: "100%",
      padding: "10px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg, #1a3a8f, #2d52c4)",
      color: "white",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      marginTop: 16,
      transition: "opacity 0.2s",
    },
    testimonialsSection: {
      background: "linear-gradient(135deg, #0d1f5c, #1a3a8f)",
      padding: "80px 40px",
      textAlign: "center",
    },
    testimonialCard: {
      maxWidth: 680,
      margin: "0 auto",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 24,
      padding: "48px 40px",
      backdropFilter: "blur(16px)",
      position: "relative",
    },
    testimonialQuote: {
      fontSize: 72,
      color: "rgba(255,255,255,0.15)",
      fontFamily: "Georgia, serif",
      position: "absolute",
      top: 16,
      left: 32,
      lineHeight: 1,
    },
    testimonialText: {
      fontSize: 18,
      color: "rgba(255,255,255,0.9)",
      lineHeight: 1.8,
      marginBottom: 28,
      position: "relative",
    },
    testimonialAuthor: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16 },
    testimonialAvatar: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #e07b00, #fbbf24)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      color: "white",
      fontSize: 16,
    },
    testimonialName: { fontWeight: 700, color: "white", marginBottom: 4 },
    testimonialRole: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
    testimonialDots: { display: "flex", gap: 8, justifyContent: "center", marginTop: 32 },
    dot: (active) => ({
      width: active ? 24 : 8,
      height: 8,
      borderRadius: 100,
      background: active ? "#e07b00" : "rgba(255,255,255,0.3)",
      transition: "all 0.3s",
      cursor: "pointer",
    }),
    ctaSection: {
      background: "white",
      padding: "80px 40px",
      textAlign: "center",
    },
    ctaBox: {
      maxWidth: 800,
      margin: "0 auto",
      background: "linear-gradient(135deg, #1a3a8f 0%, #e07b00 100%)",
      borderRadius: 28,
      padding: "64px 48px",
      position: "relative",
      overflow: "hidden",
    },
    ctaPattern: {
      position: "absolute",
      inset: 0,
      backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
    },
    ctaTitle: {
      fontSize: "clamp(28px, 4vw, 44px)",
      fontWeight: 900,
      color: "white",
      marginBottom: 16,
      position: "relative",
    },
    ctaDesc: { fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 36, position: "relative" },
    ctaButtons: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", position: "relative" },
    ctaBtnWhite: {
      padding: "16px 36px",
      borderRadius: 12,
      border: "none",
      background: "white",
      color: "#1a3a8f",
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    },
    ctaBtnGhost: {
      padding: "16px 36px",
      borderRadius: 12,
      border: "2px solid rgba(255,255,255,0.6)",
      background: "transparent",
      color: "white",
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
    },
    footer: {
      background: "#0d1f5c",
      color: "rgba(255,255,255,0.7)",
      padding: "48px 40px 24px",
    },
    footerTop: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      gap: 40,
      maxWidth: 1200,
      margin: "0 auto",
      paddingBottom: 40,
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    },
    footerLogo: { fontWeight: 800, fontSize: 20, color: "white", marginBottom: 12 },
    footerDesc: { fontSize: 14, lineHeight: 1.7, maxWidth: 280 },
    footerHeading: { fontWeight: 700, color: "white", marginBottom: 16, fontSize: 14 },
    footerLink: { display: "block", fontSize: 13, marginBottom: 10, cursor: "pointer", transition: "color 0.2s" },
    footerBottom: {
      textAlign: "center",
      paddingTop: 24,
      fontSize: 13,
      maxWidth: 1200,
      margin: "0 auto",
    },
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .hero-content { animation: fadeUp 0.8s ease both; }
        .how-card:hover { transform: translateY(-6px) !important; box-shadow: 0 12px 40px rgba(26,58,143,0.14) !important; }
        .company-card:hover { transform: translateY(-4px) !important; box-shadow: 0 8px 28px rgba(26,58,143,0.12) !important; }
        .job-card:hover { transform: translateY(-4px) !important; box-shadow: 0 8px 28px rgba(26,58,143,0.12) !important; }
        .hero-btn:hover { transform: scale(1.04); }
      `}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroGrid} />
        <div className="hero-content" style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <div style={styles.heroBadgeDot} />
            Plataforma #1 de empregos em Lagoa Vermelha e região
          </div>
          <h1 style={styles.heroTitle}>
            Conectando <span style={styles.heroHighlight}>talentos locais</span> com oportunidades
          </h1>
          <p style={styles.heroDesc}>
            A plataforma de recrutamento que une profissionais e empresas da nossa região. Rápido, simples e eficaz.
          </p>
          <div style={styles.heroButtons}>
            <button className="hero-btn" style={styles.heroBtnPrimary} onClick={handleCandidato}>
              🎯 Sou Candidato
            </button>
            <button className="hero-btn" style={styles.heroBtnOutline} onClick={handleEmpresa}>
              🏢 Sou Empresa
            </button>
          </div>
        </div>
        <div style={styles.heroScroll}>
          <span>Explorar</span>
          <span style={{ fontSize: 20 }}>↓</span>
        </div>
      </section>

      {/* STATS */}
      <div style={styles.statsBar}>
        {STATS.map((s, i) => (
          <div key={i} style={{ ...styles.statItem, borderRight: i < STATS.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            <div style={styles.statValue}><AnimatedCounter value={s.value} /></div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* COMO FUNCIONA */}
      <div style={{ background: "white" }}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionEyebrow}>Como funciona</div>
            <h2 style={styles.sectionTitle}>Simples do início ao fim</h2>
            <p style={styles.sectionDesc}>Três passos para conectar seu talento às melhores oportunidades da região.</p>
          </div>
          <div style={styles.howGrid}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="how-card" style={styles.howCard}>
                <div style={styles.howNumber}>0{i + 1}</div>
                <div style={styles.howIcon}>{item.icon}</div>
                <div style={styles.howTitle}>{item.title}</div>
                <div style={styles.howDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EMPRESAS */}
      <div style={{ background: "#f8f9fc" }}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionEyebrow}>Empresas em destaque</div>
            <h2 style={styles.sectionTitle}>Quem está contratando agora</h2>
            <p style={styles.sectionDesc}>Empresas da nossa região que confiam no Conecta Lagoa para encontrar os melhores talentos.</p>
          </div>
          <div style={styles.companiesGrid}>
            {FEATURED_COMPANIES.map((c, i) => (
              <div key={i} className="company-card" style={styles.companyCard}>
                <div style={styles.companyAvatar}>{c.name[0]}</div>
                <div>
                  <div style={styles.companyName}>{c.name}</div>
                  <div style={styles.companyArea}>{c.area}</div>
                </div>
                <div style={styles.companyVagas}>{c.vagas} vagas</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VAGAS */}
      <div style={styles.jobsSection}>
        <div style={{ ...styles.sectionHeader, padding: "0 40px" }}>
          <div style={styles.sectionEyebrow}>Vagas recentes</div>
          <h2 style={styles.sectionTitle}>Oportunidades abertas agora</h2>
        </div>
        <div style={styles.jobFilters}>
          {["Todos", "CLT", "PJ", "Estágio"].map((f) => (
            <button key={f} style={styles.jobFilterBtn(jobFilter === f)} onClick={() => setJobFilter(f)}>{f}</button>
          ))}
        </div>
        <div style={styles.jobsGrid}>
          {RECENT_JOBS.filter((j) => jobFilter === "Todos" || j.type === jobFilter).map((job, i) => (
            <div key={i} className="job-card" style={styles.jobCard}>
              <div style={styles.jobTop}>
                <div>
                  <div style={styles.jobTitle}>{job.title}</div>
                  <div style={styles.jobCompany}>{job.company}</div>
                </div>
                <span style={styles.jobBadge(job.type)}>{job.type}</span>
              </div>
              <div style={styles.jobTime}>🕐 {job.time} atrás</div>
              <button style={styles.jobApplyBtn} onClick={() => navigate('/registro')}>Candidatar-se</button>
            </div>
          ))}
        </div>
      </div>

      {/* DEPOIMENTOS */}
      <div style={styles.testimonialsSection}>
        <div style={{ ...styles.sectionEyebrow, color: "#fbbf24", marginBottom: 12 }}>Depoimentos</div>
        <h2 style={{ ...styles.sectionTitle, color: "white", marginBottom: 48 }}>O que dizem sobre nós</h2>
        <div style={styles.testimonialCard}>
          <div style={styles.testimonialQuote}>"</div>
          <p style={styles.testimonialText}>{TESTIMONIALS[activeTestimonial].text}</p>
          <div style={styles.testimonialAuthor}>
            <div style={styles.testimonialAvatar}>{TESTIMONIALS[activeTestimonial].avatar}</div>
            <div>
              <div style={styles.testimonialName}>{TESTIMONIALS[activeTestimonial].name}</div>
              <div style={styles.testimonialRole}>{TESTIMONIALS[activeTestimonial].role}</div>
            </div>
          </div>
        </div>
        <div style={styles.testimonialDots}>
          {TESTIMONIALS.map((_, i) => (
            <div key={i} style={styles.dot(i === activeTestimonial)} onClick={() => setActiveTestimonial(i)} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={styles.ctaSection}>
        <div style={styles.ctaBox}>
          <div style={styles.ctaPattern} />
          <h2 style={styles.ctaTitle}>Pronto para dar o próximo passo?</h2>
          <p style={styles.ctaDesc}>Junte-se a mais de 2.400 profissionais que já encontraram oportunidades pelo Conecta Lagoa.</p>
          <div style={styles.ctaButtons}>
            <button style={styles.ctaBtnWhite} onClick={handleCandidato}>🎯 Criar meu perfil grátis</button>
            <button style={styles.ctaBtnGhost} onClick={handleEmpresa}>🏢 Publicar uma vaga</button>
          </div>
        </div>
      </div>

     
    </div>
  );
}