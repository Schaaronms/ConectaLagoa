import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThreeBackground from "./ThreeBackground";

// ─────────────────────────────────────────────────────────────────────────────
// DADOS MOCK (substitua pelas chamadas reais à sua API)
// ─────────────────────────────────────────────────────────────────────────────
const STATS = [
  { value: 2400, suffix: "+", label: "Candidatos" },
  { value: 380,  suffix: "+", label: "Empresas" },
  { value: 1200, suffix: "+", label: "Vagas Publicadas" },
  { value: 94,   suffix: "%", label: "Satisfação" },
];

const HOW_IT_WORKS = [
  { icon: "👤", num: "01", title: "Crie seu Perfil",  desc: "Cadastre-se em minutos e monte um perfil profissional completo com habilidades e experiências." },
  { icon: "🔍", num: "02", title: "Busque Vagas",     desc: "Explore centenas de vagas filtradas para a sua área e região em tempo real." },
  { icon: "🚀", num: "03", title: "Candidate-se",     desc: "Com um clique candidate-se e acompanhe cada etapa do processo seletivo." },
];

const TESTIMONIALS = [
  { name: "Julia Oliveira", role: "Assistente Administrativa", text: "Encontrei meu emprego atual em menos de 2 semanas pelo Conecta Lagoa. A plataforma é incrível e muito fácil de usar!", avatar: "JO" },
  { name: "Carlos Mendes", role: "Desenvolvedor Web",          text: "Como empresa conseguimos contratar 3 profissionais ótimos. O processo é ágil e os candidatos são muito qualificados.", avatar: "CM" },
  { name: "Ana Paula",     role: "Analista de Marketing",      text: "A melhor plataforma de vagas da região! Conecta profissionais locais com empresas que realmente precisam deles.", avatar: "AP" },
];

const JOB_TYPES = ["Todos", "CLT", "PJ", "Estágio"];

// ─────────────────────────────────────────────────────────────────────────────
// INJECT GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("cl-home-styles")) return;
  const s = document.createElement("style");
  s.id = "cl-home-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --navy:   #002855;
      --royal:  #0056b3;
      --amber:  #d97706;
      --amber2: #f59e0b;
      --white:  #ffffff;
      --off:    #f4f7fc;
      --muted:  #64748b;
      --border: rgba(0,86,179,0.12);
      --radius: 18px;
      --sh-sm:  0 2px 12px rgba(0,40,85,0.07);
      --sh-md:  0 8px 32px rgba(0,40,85,0.12);
      --sh-lg:  0 20px 60px rgba(0,40,85,0.18);
      --tr:     all 0.28s cubic-bezier(.4,0,.2,1);
    }

    *,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }

    .cl { font-family:'DM Sans',sans-serif; color:#1a2740; overflow-x:hidden; }

    /* ── Canvas particles ── */
    .cl-canvas { position:absolute; inset:0; z-index:0; pointer-events:none; }

    /* ── HERO ── */
    .cl-hero {
      position:relative; min-height:100vh;
      display:flex; align-items:center; justify-content:center;
      background: linear-gradient(135deg,#002855 0%,#0056b3 52%,#d97706 100%);
      overflow:hidden;
    }
    .cl-hero-grid {
      position:absolute; inset:0; z-index:1;
      background-image:
        linear-gradient(rgba(255,255,255,0.045) 1px,transparent 1px),
        linear-gradient(90deg,rgba(255,255,255,0.045) 1px,transparent 1px);
      background-size:64px 64px;
    }
    .cl-hero-orb1 {
      position:absolute; border-radius:50%; filter:blur(90px); z-index:1;
      width:600px; height:600px; left:-10%; top:-20%;
      background:radial-gradient(circle,rgba(0,86,179,0.55) 0%,transparent 70%);
      animation: cl-float 9s ease-in-out infinite;
    }
    .cl-hero-orb2 {
      position:absolute; border-radius:50%; filter:blur(80px); z-index:1;
      width:500px; height:500px; right:-5%; bottom:-10%;
      background:radial-gradient(circle,rgba(217,119,6,0.5) 0%,transparent 70%);
      animation: cl-float 7s ease-in-out infinite reverse;
    }
    .cl-hero-inner {
      position:relative; z-index:2; text-align:center;
      max-width:820px; padding:0 24px;
      animation: cl-fade-up 0.9s cubic-bezier(.16,1,.3,1) both;
    }
    .cl-hero-badge {
      display:inline-flex; align-items:center; gap:8px;
      background:rgba(255,255,255,0.13); border:1px solid rgba(255,255,255,0.28);
      border-radius:100px; padding:6px 18px; margin-bottom:32px;
      color:white; font-size:13px; font-weight:600; letter-spacing:0.02em;
      backdrop-filter:blur(10px);
    }
    .cl-badge-dot {
      width:8px; height:8px; border-radius:50%;
      background:#4ade80; box-shadow:0 0 10px #4ade80;
      animation: cl-pulse 2s infinite;
    }
    .cl-hero-title {
      font-family:'Plus Jakarta Sans',sans-serif;
      font-size:clamp(36px,6.5vw,72px); font-weight:900;
      color:white; line-height:1.08; margin-bottom:20px;
      letter-spacing:-0.03em;
    }
    .cl-hero-hl {
      background:linear-gradient(90deg,#fbbf24,#f59e0b,#d97706);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .cl-hero-sub {
      font-size:clamp(16px,2vw,20px); color:rgba(255,255,255,0.82);
      margin-bottom:44px; line-height:1.65; max-width:600px; margin-left:auto; margin-right:auto;
    }
    .cl-hero-btns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin-bottom:56px; }
    .cl-btn-primary {
      padding:16px 36px; border-radius:12px; border:none;
      background:white; color:var(--navy); font-weight:700; font-size:16px; cursor:pointer;
      box-shadow:0 8px 32px rgba(0,0,0,0.2); transition:var(--tr);
      font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-btn-primary:hover { transform:translateY(-3px) scale(1.03); box-shadow:0 14px 40px rgba(0,0,0,0.25); }
    .cl-btn-outline {
      padding:16px 36px; border-radius:12px;
      border:2px solid rgba(255,255,255,0.55);
      background:rgba(255,255,255,0.1); color:white;
      font-weight:700; font-size:16px; cursor:pointer;
      backdrop-filter:blur(10px); transition:var(--tr);
      font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-btn-outline:hover { background:rgba(255,255,255,0.2); transform:translateY(-3px); }
    .cl-hero-scroll {
      position:absolute; bottom:32px; left:50%; transform:translateX(-50%);
      display:flex; flex-direction:column; align-items:center; gap:6px;
      color:rgba(255,255,255,0.55); font-size:12px; letter-spacing:0.08em; text-transform:uppercase;
      animation: cl-bounce 2.2s ease-in-out infinite;
    }
    .cl-hero-scroll svg { margin-top:2px; }

    /* ── STATS ── */
    .cl-stats-bar {
      background:white; box-shadow:0 4px 32px rgba(0,40,85,0.10);
      display:flex; justify-content:center; flex-wrap:wrap;
    }
    .cl-stat {
      padding:32px 56px; text-align:center; flex:1 1 180px;
      border-right:1px solid #f0f4ff; position:relative;
    }
    .cl-stat:last-child { border-right:none; }
    .cl-stat-val {
      font-family:'Plus Jakarta Sans',sans-serif;
      font-size:clamp(28px,3.5vw,42px); font-weight:900;
      color:var(--royal); line-height:1; margin-bottom:6px;
    }
    .cl-stat-label { font-size:12px; color:var(--muted); font-weight:600; letter-spacing:0.12em; text-transform:uppercase; }

    /* ── SECTION WRAPPER ── */
    .cl-section { padding:96px 40px; max-width:1200px; margin:0 auto; }
    .cl-section-hd { text-align:center; margin-bottom:60px; }
    .cl-eyebrow {
      font-size:11px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase;
      color:var(--amber); margin-bottom:12px;
    }
    .cl-title {
      font-family:'Plus Jakarta Sans',sans-serif;
      font-size:clamp(26px,4vw,44px); font-weight:800; color:#0f1f3d;
      line-height:1.18; margin-bottom:14px; letter-spacing:-0.02em;
    }
    .cl-desc { font-size:16px; color:var(--muted); max-width:540px; margin:0 auto; line-height:1.75; }

    /* ── HOW IT WORKS ── */
    .cl-how-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:28px; }
    .cl-how-card {
      background:white; border-radius:var(--radius); padding:44px 36px;
      box-shadow:var(--sh-sm); border:1px solid #eef2fc;
      position:relative; overflow:hidden; transition:var(--tr);
      transform-style:preserve-3d; perspective:600px;
    }
    .cl-how-card:hover { transform:translateY(-8px) rotateX(3deg); box-shadow:var(--sh-lg); }
    .cl-how-num {
      position:absolute; top:18px; right:24px;
      font-family:'Plus Jakarta Sans',sans-serif;
      font-size:72px; font-weight:900; color:#f0f4ff; line-height:1;
      pointer-events:none; user-select:none;
    }
    .cl-how-icon { font-size:44px; margin-bottom:20px; display:block; }
    .cl-how-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:20px; font-weight:700; color:#0f1f3d; margin-bottom:12px; }
    .cl-how-desc { font-size:14px; color:var(--muted); line-height:1.75; }
    .cl-how-line {
      position:absolute; bottom:0; left:0; right:0; height:3px;
      background:linear-gradient(90deg,var(--royal),var(--amber));
      transform:scaleX(0); transform-origin:left; transition:transform 0.4s ease;
    }
    .cl-how-card:hover .cl-how-line { transform:scaleX(1); }

    /* ── COMPANIES ── */
    .cl-companies-bg { background:var(--off); }
    .cl-companies-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
    .cl-company-card {
      background:white; border-radius:16px; padding:28px 24px;
      box-shadow:var(--sh-sm); border:1px solid #eef2fc;
      display:flex; align-items:center; gap:16px; cursor:pointer;
      transition:var(--tr); transform-style:preserve-3d;
    }
    .cl-company-card:hover { transform:translateY(-5px) rotateY(-3deg); box-shadow:var(--sh-md); border-color:rgba(0,86,179,0.25); }
    .cl-company-logo {
      width:54px; height:54px; border-radius:12px; flex-shrink:0; object-fit:contain;
      background:linear-gradient(135deg,var(--navy),var(--royal));
      display:flex; align-items:center; justify-content:center;
      color:white; font-weight:800; font-size:20px; font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-company-logo img { width:100%; height:100%; object-fit:contain; border-radius:12px; }
    .cl-company-name { font-weight:700; font-size:14px; color:#0f1f3d; margin-bottom:4px; font-family:'Plus Jakarta Sans',sans-serif; }
    .cl-company-area { font-size:12px; color:var(--muted); }
    .cl-company-badge {
      margin-left:auto; flex-shrink:0;
      background:#eef2ff; color:var(--royal);
      border-radius:8px; padding:5px 10px;
      font-size:12px; font-weight:700;
    }
    .cl-company-empty {
      grid-column:1/-1; text-align:center; padding:48px;
      color:var(--muted); font-size:15px;
    }

    /* ── JOBS ── */
    .cl-jobs-bg { background:linear-gradient(180deg,#f4f7fc 0%,#e8effa 100%); padding:96px 0; }
    .cl-jobs-filters { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:44px; }
    .cl-filter-btn {
      padding:9px 22px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer;
      transition:var(--tr); border:1.5px solid #dde4f0; background:white; color:#64748b;
      font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-filter-btn.active {
      border-color:transparent;
      background:linear-gradient(135deg,var(--navy),var(--royal));
      color:white; box-shadow:0 4px 18px rgba(0,86,179,0.28);
    }
    .cl-jobs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:20px; max-width:1200px; margin:0 auto; padding:0 40px; }
    .cl-job-card {
      background:white; border-radius:16px; padding:24px;
      box-shadow:var(--sh-sm); border:1px solid #eef2fc;
      transition:var(--tr); cursor:pointer;
      transform-style:preserve-3d; perspective:800px;
    }
    .cl-job-card:hover { transform:translateY(-5px) rotateX(2deg); box-shadow:var(--sh-md); border-color:rgba(0,86,179,0.2); }
    .cl-job-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px; }
    .cl-job-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; color:#0f1f3d; margin-bottom:4px; }
    .cl-job-company { font-size:13px; color:var(--muted); }
    .cl-job-badge-clt  { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:#dcfce7; color:#16a34a; white-space:nowrap; }
    .cl-job-badge-pj   { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:#fef3c7; color:#d97706; white-space:nowrap; }
    .cl-job-badge-est  { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:#f3e8ff; color:#9333ea; white-space:nowrap; }
    .cl-job-meta { display:flex; align-items:center; gap:14px; font-size:12px; color:#94a3b8; margin-bottom:4px; flex-wrap:wrap; }
    .cl-job-location { font-size:12px; color:var(--muted); margin-bottom:14px; }
    .cl-job-apply {
      width:100%; padding:11px; border-radius:10px; border:none;
      background:linear-gradient(135deg,var(--navy),var(--royal));
      color:white; font-weight:600; font-size:14px; cursor:pointer;
      transition:var(--tr); font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-job-apply:hover { opacity:0.9; transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,86,179,0.3); }
    .cl-job-empty { grid-column:1/-1; text-align:center; padding:64px; color:var(--muted); }
    .cl-jobs-more { text-align:center; margin-top:40px; }
    .cl-btn-more {
      padding:14px 36px; border-radius:12px; border:2px solid var(--royal);
      background:transparent; color:var(--royal); font-weight:700; font-size:15px;
      cursor:pointer; transition:var(--tr); font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-btn-more:hover { background:var(--royal); color:white; transform:translateY(-2px); }

    /* ── TESTIMONIALS ── */
    .cl-test-section {
      background:linear-gradient(135deg,#002855,#0056b3);
      padding:96px 40px; text-align:center;
    }
    .cl-test-card {
      max-width:700px; margin:0 auto;
      background:rgba(255,255,255,0.09); border:1px solid rgba(255,255,255,0.18);
      border-radius:24px; padding:56px 48px;
      backdrop-filter:blur(16px); position:relative; overflow:hidden;
      transition:var(--tr);
    }
    .cl-test-quote { position:absolute; top:20px; left:32px; font-size:80px; color:rgba(255,255,255,0.1); font-family:Georgia,serif; line-height:1; pointer-events:none; }
    .cl-test-text { font-size:19px; color:rgba(255,255,255,0.9); line-height:1.8; margin-bottom:32px; position:relative; font-style:italic; }
    .cl-test-author { display:flex; align-items:center; justify-content:center; gap:16px; }
    .cl-test-avatar {
      width:54px; height:54px; border-radius:50%;
      background:linear-gradient(135deg,var(--amber),var(--amber2));
      display:flex; align-items:center; justify-content:center;
      font-weight:800; color:white; font-size:16px;
      font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-test-name { font-weight:700; color:white; margin-bottom:4px; font-family:'Plus Jakarta Sans',sans-serif; }
    .cl-test-role { font-size:13px; color:rgba(255,255,255,0.6); }
    .cl-dots { display:flex; gap:8px; justify-content:center; margin-top:36px; }
    .cl-dot {
      height:8px; border-radius:100px; cursor:pointer;
      background:rgba(255,255,255,0.3); transition:var(--tr);
    }
    .cl-dot.active { width:28px; background:var(--amber); }
    .cl-dot:not(.active) { width:8px; }

    /* ── CTA ── */
    .cl-cta-section { background:white; padding:96px 40px; text-align:center; }
    .cl-cta-box {
      max-width:860px; margin:0 auto; border-radius:28px;
      background:linear-gradient(135deg,var(--navy) 0%,var(--royal) 50%,var(--amber) 100%);
      padding:72px 56px; position:relative; overflow:hidden;
    }
    .cl-cta-shine {
      position:absolute; inset:0;
      background:radial-gradient(ellipse 50% 60% at 20% 50%,rgba(255,255,255,0.1) 0%,transparent 60%),
                 radial-gradient(ellipse 40% 50% at 80% 50%,rgba(255,255,255,0.07) 0%,transparent 60%);
    }
    .cl-cta-title {
      font-family:'Plus Jakarta Sans',sans-serif;
      font-size:clamp(26px,4vw,46px); font-weight:900; color:white;
      margin-bottom:16px; position:relative; letter-spacing:-0.02em;
    }
    .cl-cta-desc { font-size:17px; color:rgba(255,255,255,0.85); margin-bottom:40px; position:relative; line-height:1.65; }
    .cl-cta-btns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; position:relative; }
    .cl-cta-btn-white {
      padding:16px 36px; border-radius:12px; border:none;
      background:white; color:var(--navy); font-weight:700; font-size:16px; cursor:pointer;
      box-shadow:0 8px 32px rgba(0,0,0,0.15); transition:var(--tr);
      font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-cta-btn-white:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 14px 40px rgba(0,0,0,0.2); }
    .cl-cta-btn-ghost {
      padding:16px 36px; border-radius:12px;
      border:2px solid rgba(255,255,255,0.6);
      background:transparent; color:white;
      font-weight:700; font-size:16px; cursor:pointer; transition:var(--tr);
      font-family:'Plus Jakarta Sans',sans-serif;
    }
    .cl-cta-btn-ghost:hover { background:rgba(255,255,255,0.15); transform:translateY(-3px); }

    /* ── LOADING SKELETON ── */
    .cl-skeleton { border-radius:10px; background:linear-gradient(90deg,#e8ecf4 25%,#f4f7fc 50%,#e8ecf4 75%); background-size:200% 100%; animation:cl-shimmer 1.4s infinite; }
    .cl-skeleton-company { height:90px; border-radius:16px; }
    .cl-skeleton-job { height:160px; border-radius:16px; }

    /* ── KEYFRAMES ── */
    @keyframes cl-float    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-22px) scale(1.04)} }
    @keyframes cl-pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.9)} }
    @keyframes cl-bounce   { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-10px)} }
    @keyframes cl-fade-up  { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cl-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes cl-reveal   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cl-count    { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }

    /* ── REVEAL ON SCROLL ── */
    .cl-reveal { opacity:0; transform:translateY(40px); transition:opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
    .cl-reveal.visible { opacity:1; transform:translateY(0); }
    .cl-reveal-d1 { transition-delay:0.08s; }
    .cl-reveal-d2 { transition-delay:0.16s; }
    .cl-reveal-d3 { transition-delay:0.24s; }
    .cl-reveal-d4 { transition-delay:0.32s; }

    /* ── TILT 3D CARD (JS-driven) ── */
    .tilt-card { transform-style:preserve-3d; perspective:1000px; will-change:transform; }

    /* ── RESPONSIVE ── */
    @media(max-width:768px){
      .cl-section { padding:64px 20px; }
      .cl-stat { padding:24px 20px; flex:1 1 40%; }
      .cl-stat:nth-child(2n) { border-right:none; }
      .cl-test-card { padding:36px 24px; }
      .cl-cta-box { padding:48px 28px; }
      .cl-jobs-grid { padding:0 20px; }
    }
  `;
  document.head.appendChild(s);
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/** Animated counter that increments when element enters viewport */
function useCounter(target, duration = 1800) {
  const [count, setCount]   = useState(0);
  const [started, setStart] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStart(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let cur = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [started, target, duration]);

  return [count, ref];
}

/** Reveal elements as they scroll into view */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".cl-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/** 3-D tilt effect on hover */
function useTilt(strength = 12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.03)`;
    };
    const onLeave = () => { el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)"; el.style.transition = "transform 0.5s ease"; };
    const onEnter = () => { el.style.transition = "transform 0.08s linear"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mouseenter", onEnter);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); el.removeEventListener("mouseenter", onEnter); };
  }, [strength]);
  return ref;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
<ThreeBackground />
// ─────────────────────────────────────────────────────────────────────────────
// STAT COUNTER ITEM
// ─────────────────────────────────────────────────────────────────────────────
function StatItem({ value, suffix, label, delay = 0 }) {
  const [count, ref] = useCounter(value);
  return (
    <div ref={ref} className="cl-stat cl-reveal" style={{ transitionDelay: `${delay}s` }}>
      <div className="cl-stat-val">{count.toLocaleString("pt-BR")}{suffix}</div>
      <div className="cl-stat-label">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB TYPE BADGE
// ─────────────────────────────────────────────────────────────────────────────
function JobBadge({ type }) {
  const cls = type === "CLT" ? "cl-job-badge-clt" : type === "PJ" ? "cl-job-badge-pj" : "cl-job-badge-est";
  return <span className={cls}>{type}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY LOGO
// ─────────────────────────────────────────────────────────────────────────────
function CompanyLogo({ company }) {
  // Tenta exibir a logo real (campo logoUrl ou logo).
  // Se não existir, usa a inicial da empresa como fallback.
  const logoSrc = company.logoUrl || company.logo || null;
  if (logoSrc) {
    return (
      <div className="cl-company-logo" style={{ background: "white", border: "1px solid #eef2fc" }}>
        <img src={logoSrc} alt={company.name || company.nomeEmpresa} />
      </div>
    );
  }
  const name   = company.name || company.nomeEmpresa || "?";
  const initials = name.trim().split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return <div className="cl-company-logo">{initials}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW-IT-WORKS CARD (with tilt)
// ─────────────────────────────────────────────────────────────────────────────
function HowCard({ item, delay }) {
  const ref = useTilt(10);
  return (
    <div ref={ref} className="cl-how-card tilt-card cl-reveal" style={{ transitionDelay: `${delay}s` }}>
      <span className="cl-how-num">{item.num}</span>
      <span className="cl-how-icon">{item.icon}</span>
      <div className="cl-how-title">{item.title}</div>
      <div className="cl-how-desc">{item.desc}</div>
      <div className="cl-how-line" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  injectStyles();

  const navigate   = useNavigate();
  const { user, isCandidato, isEmpresa } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [jobFilter,         setJobFilter]         = useState("Todos");
  const [companies,         setCompanies]         = useState([]);
  const [jobs,              setJobs]              = useState([]);
  const [loadingCompanies,  setLoadingCompanies]  = useState(true);
  const [loadingJobs,       setLoadingJobs]       = useState(true);
  const [visibleJobs,       setVisibleJobs]       = useState(6);

  // ── Scroll reveal ──────────────────────────────────────────────────────────
  useReveal();

  // ── Auto-rotate testimonials ───────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  // ── Fetch companies (empresas com vagas ativas) ────────────────────────────
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // ── INTEGRAÇÃO REAL ──────────────────────────────────────────────────
        // Ajuste o endpoint para o da sua API.
        // Esperamos um array de objetos com pelo menos:
        //   { id, name|nomeEmpresa, logoUrl|logo, area|setor, vagasCount }
        // Exemplos de endpoint possíveis:
        //   GET /api/empresas/destaques
        //   GET /api/empresas?hasVagas=true&limit=8
        // ────────────────────────────────────────────────────────────────────
        const res  = await fetch("/api/empresas/destaques");
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : data.empresas || []);
      } catch {
        // Fallback visual para evitar tela vazia
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  // ── Fetch jobs (vagas publicadas e ativas) ─────────────────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // ── INTEGRAÇÃO REAL ──────────────────────────────────────────────────
        // Esperamos um array de objetos com pelo menos:
        //   { id, titulo|title, empresa|company, tipo|type, cidade|location, createdAt|time }
        // Exemplos de endpoint possíveis:
        //   GET /api/vagas?status=ativa&limit=20
        //   GET /api/vagas/recentes
        // ────────────────────────────────────────────────────────────────────
        const res  = await fetch("/api/vagas?status=ativa&limit=20");
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : data.vagas || []);
      } catch {
        setJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleCandidato = () => {
    if (!user) navigate("/registro");
    else if (isCandidato()) navigate("/candidato/dashboard");
    else navigate("/registro");
  };
  const handleEmpresa = () => {
    if (!user) navigate("/registro");
    else if (isEmpresa()) navigate("/empresa/dashboard");
    else navigate("/registro");
  };

  // Normaliza campos que podem vir com nomes diferentes da API
  const normalizeJob = (j) => ({
    id:       j.id || j._id,
    title:    j.titulo    || j.title,
    company:  j.empresa   || j.company    || j.nomeEmpresa || "—",
    type:     j.tipo      || j.type       || j.tipoContrato || "CLT",
    location: j.cidade    || j.location   || j.municipio    || "",
    time:     j.createdAt || j.time       || j.dataPublicacao,
  });

  const normalizeCompany = (c) => ({
    id:         c.id    || c._id,
    name:       c.nome  || c.name || c.nomeEmpresa,
    logoUrl:    c.logoUrl || c.logo,
    area:       c.area  || c.setor || c.segmento,
    vagasCount: c.vagasCount ?? c.totalVagas ?? c.vagas ?? 0,
  });

  const filteredJobs = jobs
    .map(normalizeJob)
    .filter((j) => jobFilter === "Todos" || j.type === jobFilter);

  const timeAgo = (raw) => {
    if (!raw) return "";
    const diff = Math.floor((Date.now() - new Date(raw)) / 1000);
    if (diff < 3600)  return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // ── Candidate button handler (routes to empresa vaga detail) ───────────────
  const handleApply = (job) => {
    if (!user) {
      // Salva a rota de retorno para redirecionar após login
      sessionStorage.setItem("redirectAfterLogin", `/vagas/${job.id}`);
      navigate("/registro");
    } else if (isCandidato()) {
      navigate(`/vagas/${job.id}`);          // página de detalhes da vaga
    } else {
      navigate("/registro");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cl">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="cl-hero">
       <ThreeBackground />
        <div className="cl-hero-grid" />
        <div className="cl-hero-orb1" />
        <div className="cl-hero-orb2" />

        <div className="cl-hero-inner">
          <div className="cl-hero-badge">
            <div className="cl-badge-dot" />
            Plataforma #1 de empregos em Lagoa Vermelha e região
          </div>

          <h1 className="cl-hero-title">
            Conectando{" "}
            <span className="cl-hero-hl">talentos locais</span>
            <br />
            com oportunidades reais
          </h1>

          <p className="cl-hero-sub">
            A plataforma de recrutamento que une profissionais e empresas da nossa região.
            Rápido, simples e eficaz.
          </p>

          <div className="cl-hero-btns">
            <button className="cl-btn-primary" onClick={handleCandidato}>
              🎯 Sou Candidato
            </button>
            <button className="cl-btn-outline" onClick={handleEmpresa}>
              🏢 Sou Empresa
            </button>
          </div>
        </div>

        <div className="cl-hero-scroll">
          <span>Explorar</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STATS                                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="cl-stats-bar">
        {STATS.map((s, i) => (
          <StatItem key={i} value={s.value} suffix={s.suffix} label={s.label} delay={i * 0.09} />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* COMO FUNCIONA                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "white" }}>
        <div className="cl-section">
          <div className="cl-section-hd cl-reveal">
            <div className="cl-eyebrow">Como funciona</div>
            <h2 className="cl-title">Simples do início ao fim</h2>
            <p className="cl-desc">Três passos para conectar seu talento às melhores oportunidades da região.</p>
          </div>
          <div className="cl-how-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <HowCard key={i} item={item} delay={i * 0.12} />
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* EMPRESAS EM DESTAQUE — dados reais                                  */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="cl-companies-bg">
        <div className="cl-section">
          <div className="cl-section-hd cl-reveal">
            <div className="cl-eyebrow">Empresas em destaque</div>
            <h2 className="cl-title">Quem está contratando agora</h2>
            <p className="cl-desc">Empresas da nossa região que confiam no Conecta Lagoa para encontrar os melhores talentos.</p>
          </div>

          <div className="cl-companies-grid">
            {loadingCompanies
              ? Array(8).fill(0).map((_, i) => (
                  <div key={i} className="cl-skeleton cl-skeleton-company" />
                ))
              : companies.length === 0
              ? <div className="cl-company-empty">Nenhuma empresa com vagas ativas no momento.</div>
              : companies.map((raw, i) => {
                  const c = normalizeCompany(raw);
                  return (
                    <div
                      key={c.id || i}
                      className={`cl-company-card cl-reveal cl-reveal-d${(i % 4) + 1}`}
                      onClick={() => navigate(`/empresa/${c.id}`)}
                    >
                      <CompanyLogo company={c} />
                      <div>
                        <div className="cl-company-name">{c.name}</div>
                        {c.area && <div className="cl-company-area">{c.area}</div>}
                      </div>
                      <div className="cl-company-badge">{c.vagasCount} vagas</div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VAGAS RECENTES — dados reais                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="cl-jobs-bg">
        <div className="cl-section-hd cl-reveal" style={{ padding: "0 40px 0" }}>
          <div className="cl-eyebrow">Vagas recentes</div>
          <h2 className="cl-title">Oportunidades abertas agora</h2>
        </div>

        <div className="cl-jobs-filters cl-reveal">
          {JOB_TYPES.map((f) => (
            <button
              key={f}
              className={`cl-filter-btn ${jobFilter === f ? "active" : ""}`}
              onClick={() => { setJobFilter(f); setVisibleJobs(6); }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="cl-jobs-grid">
          {loadingJobs
            ? Array(6).fill(0).map((_, i) => (
                <div key={i} className="cl-skeleton cl-skeleton-job" />
              ))
            : filteredJobs.length === 0
            ? <div className="cl-job-empty">
                <p style={{ fontSize: 15 }}>Nenhuma vaga encontrada para este filtro.</p>
              </div>
            : filteredJobs.slice(0, visibleJobs).map((job, i) => (
                <div
                  key={job.id || i}
                  className={`cl-job-card cl-reveal cl-reveal-d${(i % 3) + 1}`}
                >
                  <div className="cl-job-top">
                    <div>
                      <div className="cl-job-title">{job.title}</div>
                      <div className="cl-job-company">{job.company}</div>
                    </div>
                    <JobBadge type={job.type} />
                  </div>
                  {job.location && (
                    <div className="cl-job-location">📍 {job.location}</div>
                  )}
                  <div className="cl-job-meta">
                    {job.time && <span>🕐 {timeAgo(job.time)} atrás</span>}
                  </div>
                  <button className="cl-job-apply" onClick={() => handleApply(job)}>
                    Candidatar-se →
                  </button>
                </div>
              ))}
        </div>

        {/* "Ver mais vagas" */}
        {!loadingJobs && filteredJobs.length > visibleJobs && (
          <div className="cl-jobs-more">
            <button className="cl-btn-more" onClick={() => setVisibleJobs((v) => v + 6)}>
              Ver mais vagas
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DEPOIMENTOS                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="cl-test-section">
        <div className="cl-eyebrow cl-reveal" style={{ color: "#fbbf24", marginBottom: 12 }}>Depoimentos</div>
        <h2 className="cl-title cl-reveal" style={{ color: "white", marginBottom: 48 }}>O que dizem sobre nós</h2>

        <div className="cl-test-card cl-reveal">
          <div className="cl-test-quote">"</div>
          <p className="cl-test-text">{TESTIMONIALS[activeTestimonial].text}</p>
          <div className="cl-test-author">
            <div className="cl-test-avatar">{TESTIMONIALS[activeTestimonial].avatar}</div>
            <div>
              <div className="cl-test-name">{TESTIMONIALS[activeTestimonial].name}</div>
              <div className="cl-test-role">{TESTIMONIALS[activeTestimonial].role}</div>
            </div>
          </div>
        </div>

        <div className="cl-dots">
          {TESTIMONIALS.map((_, i) => (
            <div
              key={i}
              className={`cl-dot ${i === activeTestimonial ? "active" : ""}`}
              onClick={() => setActiveTestimonial(i)}
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CTA FINAL                                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="cl-cta-section">
        <div className="cl-cta-box cl-reveal">
          <div className="cl-cta-shine" />
          <h2 className="cl-cta-title">Pronto para dar o próximo passo?</h2>
          <p className="cl-cta-desc">
            Junte-se a mais de 2.400 profissionais que já encontraram oportunidades pelo Conecta Lagoa.
          </p>
          <div className="cl-cta-btns">
            <button className="cl-cta-btn-white" onClick={handleCandidato}>
              🎯 Criar meu perfil grátis
            </button>
            <button className="cl-cta-btn-ghost" onClick={handleEmpresa}>
              🏢 Publicar uma vaga
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
