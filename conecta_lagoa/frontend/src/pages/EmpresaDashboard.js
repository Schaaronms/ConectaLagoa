import React, { useState, useEffect, useCallback } from 'react';
import { empresaAPI } from '../services/api';
import './Dashboard.css';

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const APPLICATIONS_DATA = [
  { mes: "Ago", candidaturas: 42, contratacoes: 8 },
  { mes: "Set", candidaturas: 68, contratacoes: 14 },
  { mes: "Out", candidaturas: 55, contratacoes: 11 },
  { mes: "Nov", candidaturas: 89, contratacoes: 18 },
  { mes: "Dez", candidaturas: 74, contratacoes: 15 },
  { mes: "Jan", candidaturas: 112, contratacoes: 24 },
  { mes: "Fev", candidaturas: 98, contratacoes: 21 },
];

const AREA_DATA = [
  { mes: "Ago", vagas: 28 },
  { mes: "Set", vagas: 41 },
  { mes: "Out", vagas: 35 },
  { mes: "Nov", vagas: 58 },
  { mes: "Dez", vagas: 47 },
  { mes: "Jan", vagas: 73 },
  { mes: "Fev", vagas: 62 },
];

const AREA_DISTRIBUTION = [
  { name: "Tecnologia", value: 34, color: "#1a3a8f" },
  { name: "Comércio", value: 28, color: "#e07b00" },
  { name: "Saúde", value: 18, color: "#10b981" },
  { name: "Construção", value: 12, color: "#f59e0b" },
  { name: "Outros", value: 8, color: "#8b5cf6" },
];

const RECENT_CANDIDATES = [
  { name: "Julia Oliveira", role: "Assistente Admin.", status: "Em Análise", score: 92, avatar: "JO" },
  { name: "Carlos Mendes", role: "Dev. Web", status: "Aprovado", score: 98, avatar: "CM" },
  { name: "Ana Paula", role: "Analista Mkt.", status: "Entrevista", score: 85, avatar: "AP" },
  { name: "Pedro Souza", role: "Enfermeiro", status: "Em Análise", score: 78, avatar: "PS" },
  { name: "Mariana Lima", role: "Designer UI", status: "Aprovado", score: 95, avatar: "ML" },
];

const STATUS_COLOR = {
  "Aprovado": { bg: "#dcfce7", color: "#16a34a" },
  "Em Análise": { bg: "#fef3c7", color: "#d97706" },
  "Entrevista": { bg: "#dbeafe", color: "#1d4ed8" },
  "Reprovado": { bg: "#fee2e2", color: "#dc2626" },
};

const KPIS = [
  { label: "Vagas Ativas", value: "47", delta: "+8 esta semana", icon: "💼", color: "#1a3a8f" },
  { label: "Candidaturas", value: "312", delta: "+24 hoje", icon: "📋", color: "#e07b00" },
  { label: "Contratações", value: "21", delta: "+3 este mês", icon: "✅", color: "#10b981" },
  { label: "Taxa de Conversão", value: "6,7%", delta: "+0.4% vs mês ant.", icon: "📈", color: "#8b5cf6" },
];

const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", active: true },
  { icon: "💼", label: "Vagas" },
  { icon: "👥", label: "Candidatos" },
  { icon: "🏢", label: "Empresa" },
  { icon: "💬", label: "Mensagens" },
  { icon: "⚙️", label: "Configurações" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "white",
      border: "1px solid #e8ecf4",
      borderRadius: 12,
      padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(26,58,143,0.1)",
      fontSize: 13,
    }}>
      <p style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function ConectaLagoaDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const styles = {
    root: {
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
      display: "flex",
      minHeight: "100vh",
      background: "#f0f4ff",
      color: "#1a1a2e",
    },

    /* SIDEBAR */
    sidebar: {
      width: 240,
      background: "linear-gradient(180deg, #0d1f5c 0%, #1a3a8f 100%)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      zIndex: 50,
    },
    sidebarLogo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 20px 28px",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      marginBottom: 20,
    },
    logoIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: "linear-gradient(135deg, #e07b00, #fbbf24)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      color: "white",
      fontSize: 15,
    },
    logoText: { fontWeight: 800, color: "white", fontSize: 16 },
    logoSub: { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2, fontWeight: 600 },
    navItem: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 20px",
      cursor: "pointer",
      borderRadius: "0 100px 100px 0",
      marginRight: 16,
      marginBottom: 4,
      background: active ? "rgba(255,255,255,0.15)" : "transparent",
      borderLeft: active ? "3px solid #e07b00" : "3px solid transparent",
      color: active ? "white" : "rgba(255,255,255,0.6)",
      fontWeight: active ? 600 : 400,
      fontSize: 14,
      transition: "all 0.2s",
    }),
    sidebarProfile: {
      marginTop: "auto",
      padding: "20px",
      borderTop: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #e07b00, #fbbf24)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      color: "white",
      fontSize: 14,
    },
    profileName: { fontSize: 13, fontWeight: 700, color: "white" },
    profileRole: { fontSize: 11, color: "rgba(255,255,255,0.5)" },

    /* MAIN */
    main: {
      marginLeft: 240,
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    topbar: {
      background: "white",
      padding: "0 32px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
      borderBottom: "1px solid #e8ecf4",
    },
    topbarTitle: { fontSize: 20, fontWeight: 800, color: "#1a1a2e" },
    topbarSub: { fontSize: 13, color: "#888", marginTop: 2 },
    topbarRight: { display: "flex", alignItems: "center", gap: 16 },
    publishBtn: {
      padding: "10px 20px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg, #1a3a8f, #2d52c4)",
      color: "white",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(26,58,143,0.25)",
    },
    notifBell: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "#f0f4ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 18,
      position: "relative",
    },
    notifDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#e07b00",
    },

    content: { padding: 28, flex: 1 },

    /* KPI CARDS */
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20,
      marginBottom: 28,
    },
    kpiCard: (color) => ({
      background: "white",
      borderRadius: 16,
      padding: "24px",
      boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
      borderTop: `4px solid ${color}`,
      transition: "transform 0.2s",
    }),
    kpiTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    kpiIcon: (color) => ({
      width: 44,
      height: 44,
      borderRadius: 12,
      background: color + "15",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
    }),
    kpiValue: { fontSize: 32, fontWeight: 900, color: "#1a1a2e", lineHeight: 1 },
    kpiLabel: { fontSize: 13, color: "#888", marginTop: 4 },
    kpiDelta: { fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 8 },

    /* CHART CARDS */
    chartsRow: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 28 },
    chartCard: {
      background: "white",
      borderRadius: 16,
      padding: "24px",
      boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
    },
    chartTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 },
    chartSub: { fontSize: 12, color: "#aaa", marginBottom: 20 },

    /* BOTTOM ROW */
    bottomRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
    tableHeader: {
      display: "grid",
      gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
      padding: "8px 0",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#aaa",
      borderBottom: "1px solid #f0f0f0",
      marginBottom: 12,
    },
    tableRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
      padding: "12px 0",
      borderBottom: "1px solid #f8f8f8",
      alignItems: "center",
    },
    candidateInfo: { display: "flex", alignItems: "center", gap: 10 },
    candidateAvatar: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1a3a8f, #e07b00)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      color: "white",
    },
    candidateName: { fontSize: 13, fontWeight: 600, color: "#1a1a2e" },
    candidateRole: { fontSize: 11, color: "#888" },
    statusBadge: (status) => ({
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: STATUS_COLOR[status]?.bg || "#f3f4f6",
      color: STATUS_COLOR[status]?.color || "#666",
    }),
    scoreBar: (score) => ({
      width: "100%",
      height: 6,
      borderRadius: 100,
      background: "#f0f4ff",
      position: "relative",
      overflow: "hidden",
    }),
    scoreBarFill: (score) => ({
      position: "absolute",
      top: 0,
      left: 0,
      height: "100%",
      width: `${score}%`,
      borderRadius: 100,
      background: score >= 90 ? "#10b981" : score >= 75 ? "#f59e0b" : "#ef4444",
    }),
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .kpi-card:hover { transform: translateY(-3px); }
      `}</style>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>CL</div>
          <div>
            <div style={styles.logoText}>Conecta Lagoa</div>
            <div style={styles.logoSub}>ÁREA DA EMPRESA</div>
          </div>
        </div>

        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            style={styles.navItem(activeNav === item.label)}
            onClick={() => setActiveNav(item.label)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div style={styles.sidebarProfile}>
          <div style={styles.profileAvatar}>TX</div>
          <div>
            <div style={styles.profileName}>Textech Ltda.</div>
            <div style={styles.profileRole}>Plano Pro</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div>
            <div style={styles.topbarTitle}>Dashboard</div>
            <div style={styles.topbarSub}>Fevereiro 2025 · Atualizado há 3 min</div>
          </div>
          <div style={styles.topbarRight}>
            <div style={styles.notifBell}>
              🔔
              <div style={styles.notifDot} />
            </div>
            <button style={styles.publishBtn}>+ Publicar Vaga</button>
          </div>
        </div>

        <div style={styles.content}>
          {/* KPIs */}
          <div style={styles.kpiGrid}>
            {KPIS.map((kpi, i) => (
              <div key={i} className="kpi-card" style={styles.kpiCard(kpi.color)}>
                <div style={styles.kpiTop}>
                  <div>
                    <div style={styles.kpiValue}>{kpi.value}</div>
                    <div style={styles.kpiLabel}>{kpi.label}</div>
                  </div>
                  <div style={styles.kpiIcon(kpi.color)}>{kpi.icon}</div>
                </div>
                <div style={styles.kpiDelta}>↑ {kpi.delta}</div>
              </div>
            ))}
          </div>

          {/* CHARTS ROW 1 */}
          <div style={styles.chartsRow}>
            {/* Area Chart - Vagas */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Candidaturas vs. Contratações</div>
              <div style={styles.chartSub}>Últimos 7 meses</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={APPLICATIONS_DATA}>
                  <defs>
                    <linearGradient id="candidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a3a8f" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1a3a8f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="contratGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e07b00" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#e07b00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Area type="monotone" dataKey="candidaturas" name="Candidaturas" stroke="#1a3a8f" strokeWidth={2.5} fill="url(#candidGrad)" dot={{ fill: "#1a3a8f", r: 4 }} />
                  <Area type="monotone" dataKey="contratacoes" name="Contratações" stroke="#e07b00" strokeWidth={2.5} fill="url(#contratGrad)" dot={{ fill: "#e07b00", r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie - Areas */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Vagas por Área</div>
              <div style={styles.chartSub}>Distribuição atual</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={AREA_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {AREA_DISTRIBUTION.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {AREA_DISTRIBUTION.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: "#555" }}>{d.name}</span>
                    <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHARTS ROW 2 */}
          <div style={styles.bottomRow}>
            {/* Bar Chart - Vagas publicadas */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Vagas Publicadas por Mês</div>
              <div style={styles.chartSub}>Evolução mensal</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={AREA_DATA} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#aaa" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="vagas" name="Vagas" radius={[6, 6, 0, 0]}>
                    {AREA_DATA.map((_, i) => (
                      <Cell key={i} fill={i === AREA_DATA.length - 1 ? "#e07b00" : "#1a3a8f"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Candidates Table */}
            <div style={styles.chartCard}>
              <div style={styles.chartTitle}>Candidatos Recentes</div>
              <div style={styles.chartSub}>Últimas candidaturas recebidas</div>
              <div style={styles.tableHeader}>
                <span>Candidato</span>
                <span>Cargo</span>
                <span>Status</span>
                <span>Score</span>
              </div>
              {RECENT_CANDIDATES.map((c, i) => (
                <div key={i} style={styles.tableRow}>
                  <div style={styles.candidateInfo}>
                    <div style={styles.candidateAvatar}>{c.avatar}</div>
                    <div style={styles.candidateName}>{c.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>{c.role}</div>
                  <div><span style={styles.statusBadge(c.status)}>{c.status}</span></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{c.score}</div>
                    <div style={styles.scoreBar(c.score)}>
                      <div style={styles.scoreBarFill(c.score)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
