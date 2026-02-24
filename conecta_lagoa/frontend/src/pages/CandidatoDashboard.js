import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  "Enviado":    { bg: "#e0f2fe", color: "#0369a1", icon: "📤" },
  "Visualizado":{ bg: "#fef9c3", color: "#854d0e", icon: "👁️" },
  "Em Análise": { bg: "#fef3c7", color: "#d97706", icon: "🔍" },
  "Entrevista": { bg: "#dbeafe", color: "#1d4ed8", icon: "🎯" },
  "Aprovado":   { bg: "#dcfce7", color: "#16a34a", icon: "✅" },
  "Reprovado":  { bg: "#fee2e2", color: "#dc2626", icon: "❌" },
};

const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", key: "dashboard" },
  { icon: "💼", label: "Vagas",     key: "vagas"     },
  { icon: "📋", label: "Candidaturas", key: "candidaturas" },
  { icon: "💬", label: "Mensagens", key: "mensagens" },
  { icon: "👤", label: "Meu Perfil", key: "perfil"  },
];

export default function CandidatoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [vagas, setVagas] = useState([]);
  const [candidaturas, setCandidaturas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vagaFiltro, setVagaFiltro] = useState("Todos");
  const [candidatandoId, setCandidatandoId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [msgNaoLidas, setMsgNaoLidas] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [vagasRes, candidaturasRes, mensagensRes] = await Promise.all([
        fetch("/api/vagas", { headers }),
        fetch("/api/vagas/candidato/minhas", { headers }),
        fetch("/api/vagas/mensagens/minhas", { headers }),
      ]);

      const [vagasData, candidaturasData, mensagensData] = await Promise.all([
        vagasRes.json(), candidaturasRes.json(), mensagensRes.json(),
      ]);

      setVagas(Array.isArray(vagasData) ? vagasData : []);
      setCandidaturas(Array.isArray(candidaturasData) ? candidaturasData : []);
      setMensagens(Array.isArray(mensagensData) ? mensagensData : []);
      setMsgNaoLidas((mensagensData || []).filter(m => !m.lida).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidatar = async (vagaId) => {
    setCandidatandoId(vagaId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/vagas/${vagaId}/candidatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensagem_candidato: "" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Candidatura enviada com sucesso! 🎉");
        fetchAll();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setSuccessMsg(data.error || "Erro ao candidatar");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setSuccessMsg("Erro de conexão");
      setTimeout(() => setSuccessMsg(""), 4000);
    } finally {
      setCandidatandoId(null);
    }
  };

  const marcarLida = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`/api/vagas/mensagens/${id}/lida`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMensagens(prev => prev.map(m => m.id === id ? { ...m, lida: true } : m));
    setMsgNaoLidas(prev => Math.max(0, prev - 1));
  };

  const jaSeInscreveu = (vagaId) => candidaturas.some(c => c.vaga_id === vagaId);

  const calcularPerfil = () => {
    if (!user) return 0;
    let score = 20;
    if (user.nome) score += 20;
    if (user.email) score += 15;
    if (user.telefone) score += 15;
    if (user.curriculo) score += 20;
    if (user.habilidades) score += 10;
    return Math.min(score, 100);
  };

  const perfilPct = calcularPerfil();

  const styles = {
    root: {
      display: "flex",
      minHeight: "100vh",
      background: "#f0f4ff",
      fontFamily: "'Sora', 'Segoe UI', sans-serif",
    },
    sidebar: {
      width: 230,
      background: "linear-gradient(180deg, #0d1f5c 0%, #1a3a8f 100%)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
      position: "fixed",
      height: "100vh",
      top: 0,
      left: 0,
      zIndex: 50,
    },
    sidebarLogo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 20px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      marginBottom: 16,
    },
    logoIcon: {
      width: 36,
      height: 36,
      borderRadius: 9,
      background: "linear-gradient(135deg, #e07b00, #fbbf24)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      color: "white",
      fontSize: 14,
    },
    logoText: { fontWeight: 800, color: "white", fontSize: 15 },
    logoSub: { fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2 },
    navItem: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 20px",
      cursor: "pointer",
      borderRadius: "0 100px 100px 0",
      marginRight: 16,
      marginBottom: 2,
      background: active ? "rgba(255,255,255,0.15)" : "transparent",
      borderLeft: active ? "3px solid #e07b00" : "3px solid transparent",
      color: active ? "white" : "rgba(255,255,255,0.6)",
      fontWeight: active ? 600 : 400,
      fontSize: 14,
      transition: "all 0.2s",
      position: "relative",
    }),
    badge: {
      marginLeft: "auto",
      background: "#e07b00",
      color: "white",
      borderRadius: 100,
      padding: "1px 7px",
      fontSize: 11,
      fontWeight: 700,
    },
    sidebarBottom: {
      marginTop: "auto",
      padding: "16px 20px",
      borderTop: "1px solid rgba(255,255,255,0.1)",
    },
    avatarRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #e07b00, #fbbf24)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      color: "white",
      fontSize: 14,
    },
    userName: { fontSize: 13, fontWeight: 600, color: "white" },
    userRole: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
    logoutBtn: {
      width: "100%",
      padding: "8px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.2)",
      background: "transparent",
      color: "rgba(255,255,255,0.7)",
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "'Sora', sans-serif",
    },
    main: { marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" },
    topbar: {
      background: "white",
      padding: "0 28px",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 12px rgba(26,58,143,0.06)",
      borderBottom: "1px solid #e8ecf4",
    },
    topbarTitle: { fontSize: 18, fontWeight: 800, color: "#1a1a2e" },
    topbarSub: { fontSize: 12, color: "#aaa", marginTop: 2 },
    content: { padding: 24, flex: 1 },
    toast: {
      position: "fixed",
      top: 20,
      right: 20,
      background: successMsg.includes("Erro") ? "#fee2e2" : "#dcfce7",
      color: successMsg.includes("Erro") ? "#dc2626" : "#16a34a",
      border: `1px solid ${successMsg.includes("Erro") ? "#fca5a5" : "#86efac"}`,
      borderRadius: 12,
      padding: "12px 20px",
      fontSize: 14,
      fontWeight: 600,
      zIndex: 999,
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    },
    // Cards
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 16,
      marginBottom: 24,
    },
    kpiCard: (color) => ({
      background: "white",
      borderRadius: 14,
      padding: "20px",
      boxShadow: "0 2px 12px rgba(26,58,143,0.06)",
      borderTop: `4px solid ${color}`,
    }),
    kpiValue: { fontSize: 30, fontWeight: 900, color: "#1a1a2e", lineHeight: 1 },
    kpiLabel: { fontSize: 12, color: "#888", marginTop: 4, fontWeight: 500 },
    card: {
      background: "white",
      borderRadius: 16,
      padding: "24px",
      boxShadow: "0 2px 12px rgba(26,58,143,0.06)",
      marginBottom: 20,
    },
    cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 },
    // Perfil
    perfilHeader: {
      display: "flex",
      alignItems: "center",
      gap: 20,
      marginBottom: 20,
      padding: "20px",
      background: "linear-gradient(135deg, #f0f4ff, #fff)",
      borderRadius: 14,
      border: "1px solid #e8ecf4",
    },
    perfilAvatar: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1a3a8f, #e07b00)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 24,
      fontWeight: 800,
      color: "white",
      flexShrink: 0,
    },
    perfilName: { fontSize: 22, fontWeight: 800, color: "#1a1a2e" },
    perfilRole: { fontSize: 14, color: "#888", marginBottom: 8 },
    progressBar: {
      width: "100%",
      height: 8,
      background: "#f0f4ff",
      borderRadius: 100,
      overflow: "hidden",
      marginTop: 6,
    },
    progressFill: (pct) => ({
      height: "100%",
      width: `${pct}%`,
      background: pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444",
      borderRadius: 100,
      transition: "width 1s ease",
    }),
    // Vagas
    vagasGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 16,
    },
    vagaCard: {
      background: "white",
      borderRadius: 14,
      padding: "20px",
      boxShadow: "0 2px 12px rgba(26,58,143,0.06)",
      border: "1px solid #f0f4ff",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    vagaTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 },
    vagaEmpresa: { fontSize: 13, color: "#888", marginBottom: 12 },
    vagaBadge: (type) => ({
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: type === "CLT" ? "#dcfce7" : type === "PJ" ? "#fef3c7" : "#f3e8ff",
      color: type === "CLT" ? "#16a34a" : type === "PJ" ? "#d97706" : "#9333ea",
      marginRight: 6,
    }),
    candidatarBtn: (inscrito) => ({
      width: "100%",
      marginTop: 14,
      padding: "10px",
      borderRadius: 10,
      border: "none",
      background: inscrito
        ? "#f0f4ff"
        : "linear-gradient(135deg, #1a3a8f, #2d52c4)",
      color: inscrito ? "#1a3a8f" : "white",
      fontWeight: 600,
      fontSize: 13,
      cursor: inscrito ? "default" : "pointer",
      fontFamily: "'Sora', sans-serif",
    }),
    // Candidaturas
    candidaturaRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid #f8f9fc",
    },
    statusBadge: (status) => ({
      padding: "4px 12px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      background: STATUS_CONFIG[status]?.bg || "#f3f4f6",
      color: STATUS_CONFIG[status]?.color || "#666",
    }),
    // Mensagens
    msgCard: (lida) => ({
      padding: "16px",
      borderRadius: 12,
      border: `1px solid ${lida ? "#f0f4ff" : "#bfdbfe"}`,
      background: lida ? "white" : "#eff6ff",
      marginBottom: 10,
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    msgTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    msgRemetente: { fontWeight: 700, fontSize: 14, color: "#1a1a2e" },
    msgVaga: { fontSize: 12, color: "#888", marginBottom: 6 },
    msgTexto: { fontSize: 13, color: "#555", lineHeight: 1.5 },
    msgData: { fontSize: 11, color: "#aaa" },
    filtros: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    filtroBtn: (active) => ({
      padding: "6px 16px",
      borderRadius: 100,
      border: active ? "none" : "1px solid #dde2f0",
      background: active ? "linear-gradient(135deg, #1a3a8f, #2d52c4)" : "white",
      color: active ? "white" : "#666",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
    }),
    emptyState: {
      textAlign: "center",
      padding: "40px",
      color: "#aaa",
      fontSize: 14,
    },
  };

  const getInitials = (nome) => {
    if (!nome) return "?";
    return nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const vagasFiltradas = vagas.filter(v =>
    vagaFiltro === "Todos" ? true : v.tipo_contrato === vagaFiltro
  );

  const renderDashboard = () => (
    <>
      {/* Perfil header */}
      <div style={styles.perfilHeader}>
        <div style={styles.perfilAvatar}>{getInitials(user?.nome)}</div>
        <div style={{ flex: 1 }}>
          <div style={styles.perfilName}>Olá, {user?.nome?.split(" ")[0]}! 👋</div>
          <div style={styles.perfilRole}>Candidato · {user?.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.progressBar}>
              <div style={styles.progressFill(perfilPct)} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1a3a8f", whiteSpace: "nowrap" }}>
              {perfilPct}% completo
            </span>
          </div>
        </div>
        {perfilPct < 80 && (
          <button
            style={{ ...styles.candidatarBtn(false), width: "auto", padding: "10px 20px" }}
            onClick={() => navigate("/candidato/editar")}
          >
            Completar Perfil
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard("#1a3a8f")}>
          <div style={styles.kpiValue}>{candidaturas.length}</div>
          <div style={styles.kpiLabel}>Candidaturas</div>
        </div>
        <div style={styles.kpiCard("#e07b00")}>
          <div style={styles.kpiValue}>{candidaturas.filter(c => c.status === "Em Análise" || c.status === "Entrevista").length}</div>
          <div style={styles.kpiLabel}>Em Processo</div>
        </div>
        <div style={styles.kpiCard("#10b981")}>
          <div style={styles.kpiValue}>{candidaturas.filter(c => c.status === "Aprovado").length}</div>
          <div style={styles.kpiLabel}>Aprovações</div>
        </div>
        <div style={styles.kpiCard("#8b5cf6")}>
          <div style={styles.kpiValue}>{msgNaoLidas}</div>
          <div style={styles.kpiLabel}>Mensagens Novas</div>
        </div>
      </div>

      {/* Últimas candidaturas */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={styles.cardTitle}>📋 Últimas Candidaturas</div>
          <button style={{ ...styles.filtroBtn(false), border: "none", color: "#1a3a8f", background: "transparent", fontWeight: 700 }}
            onClick={() => setActiveTab("candidaturas")}>Ver todas →</button>
        </div>
        {candidaturas.length === 0 ? (
          <div style={styles.emptyState}>Você ainda não se candidatou a nenhuma vaga.<br />
            <button style={{ ...styles.candidatarBtn(false), width: "auto", marginTop: 12, padding: "10px 24px" }}
              onClick={() => setActiveTab("vagas")}>Ver vagas disponíveis</button>
          </div>
        ) : (
          candidaturas.slice(0, 4).map((c, i) => (
            <div key={i} style={styles.candidaturaRow}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{c.vaga_titulo}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{c.empresa_nome} · {c.cidade}</div>
              </div>
              <span style={styles.statusBadge(c.status)}>
                {STATUS_CONFIG[c.status]?.icon} {c.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Vagas recomendadas */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={styles.cardTitle}>🔥 Vagas Recomendadas</div>
          <button style={{ ...styles.filtroBtn(false), border: "none", color: "#1a3a8f", background: "transparent", fontWeight: 700 }}
            onClick={() => setActiveTab("vagas")}>Ver todas →</button>
        </div>
        <div style={styles.vagasGrid}>
          {vagas.slice(0, 3).map((v, i) => (
            <div key={i} style={styles.vagaCard}>
              <div style={styles.vagaTitle}>{v.titulo}</div>
              <div style={styles.vagaEmpresa}>{v.empresa_nome} · {v.cidade}</div>
              <span style={styles.vagaBadge(v.tipo_contrato)}>{v.tipo_contrato}</span>
              {v.salario && <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{v.salario}</span>}
              <button
                style={styles.candidatarBtn(jaSeInscreveu(v.id))}
                onClick={() => !jaSeInscreveu(v.id) && handleCandidatar(v.id)}
                disabled={candidatandoId === v.id}
              >
                {candidatandoId === v.id ? "Enviando..." : jaSeInscreveu(v.id) ? "✅ Candidatura enviada" : "Candidatar-se"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mensagens recentes */}
      {mensagens.length > 0 && (
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={styles.cardTitle}>💬 Mensagens Recentes</div>
            <button style={{ ...styles.filtroBtn(false), border: "none", color: "#1a3a8f", background: "transparent", fontWeight: 700 }}
              onClick={() => setActiveTab("mensagens")}>Ver todas →</button>
          </div>
          {mensagens.slice(0, 2).map((m, i) => (
            <div key={i} style={styles.msgCard(m.lida)} onClick={() => !m.lida && marcarLida(m.id)}>
              <div style={styles.msgTop}>
                <span style={styles.msgRemetente}>{m.remetente_nome}</span>
                {!m.lida && <span style={{ background: "#e07b00", color: "white", borderRadius: 100, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>NOVO</span>}
              </div>
              <div style={styles.msgVaga}>Sobre: {m.vaga_titulo}</div>
              <div style={styles.msgTexto}>{m.conteudo}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderVagas = () => (
    <>
      <div style={styles.filtros}>
        {["Todos", "CLT", "PJ", "Estágio", "Freelance"].map(f => (
          <button key={f} style={styles.filtroBtn(vagaFiltro === f)} onClick={() => setVagaFiltro(f)}>{f}</button>
        ))}
      </div>
      {vagasFiltradas.length === 0 ? (
        <div style={styles.emptyState}>Nenhuma vaga encontrada com esse filtro.</div>
      ) : (
        <div style={styles.vagasGrid}>
          {vagasFiltradas.map((v, i) => (
            <div key={i} style={styles.vagaCard}>
              <div style={styles.vagaTitle}>{v.titulo}</div>
              <div style={styles.vagaEmpresa}>{v.empresa_nome} · {v.cidade}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={styles.vagaBadge(v.tipo_contrato)}>{v.tipo_contrato}</span>
                {v.area && <span style={{ fontSize: 12, color: "#888" }}>{v.area}</span>}
              </div>
              {v.salario && <div style={{ fontSize: 13, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>{v.salario}</div>}
              {v.descricao && <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, marginBottom: 12 }}>{v.descricao.slice(0, 100)}...</div>}
              <button
                style={styles.candidatarBtn(jaSeInscreveu(v.id))}
                onClick={() => !jaSeInscreveu(v.id) && handleCandidatar(v.id)}
                disabled={candidatandoId === v.id}
              >
                {candidatandoId === v.id ? "Enviando..." : jaSeInscreveu(v.id) ? "✅ Já me candidatei" : "🚀 Candidatar-se"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderCandidaturas = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Todas as Candidaturas ({candidaturas.length})</div>
      {candidaturas.length === 0 ? (
        <div style={styles.emptyState}>Você ainda não se candidatou a nenhuma vaga.</div>
      ) : (
        candidaturas.map((c, i) => (
          <div key={i} style={styles.candidaturaRow}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{c.vaga_titulo}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{c.empresa_nome} · {c.tipo_contrato} · {c.cidade}</div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>
                Candidatura em {new Date(c.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <span style={styles.statusBadge(c.status)}>
              {STATUS_CONFIG[c.status]?.icon} {c.status}
            </span>
          </div>
        ))
      )}
    </div>
  );

  const renderMensagens = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Mensagens das Empresas ({mensagens.length})</div>
      {mensagens.length === 0 ? (
        <div style={styles.emptyState}>Nenhuma mensagem ainda.<br />As empresas entrarão em contato por aqui quando interessadas no seu perfil.</div>
      ) : (
        mensagens.map((m, i) => (
          <div key={i} style={styles.msgCard(m.lida)} onClick={() => !m.lida && marcarLida(m.id)}>
            <div style={styles.msgTop}>
              <span style={styles.msgRemetente}>{m.remetente_nome}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!m.lida && <span style={{ background: "#e07b00", color: "white", borderRadius: 100, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>NOVO</span>}
                <span style={styles.msgData}>{new Date(m.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            <div style={styles.msgVaga}>📌 Sobre a vaga: {m.vaga_titulo}</div>
            <div style={styles.msgTexto}>{m.conteudo}</div>
          </div>
        ))
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) return (
      <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        Carregando...
      </div>
    );
    switch (activeTab) {
      case "dashboard": return renderDashboard();
      case "vagas": return renderVagas();
      case "candidaturas": return renderCandidaturas();
      case "mensagens": return renderMensagens();
      case "perfil": return (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Meu Perfil</div>
          <div style={styles.perfilHeader}>
            <div style={styles.perfilAvatar}>{getInitials(user?.nome)}</div>
            <div>
              <div style={styles.perfilName}>{user?.nome}</div>
              <div style={styles.perfilRole}>{user?.email}</div>
            </div>
          </div>
          <button
            style={{ ...styles.candidatarBtn(false), width: "auto", padding: "12px 28px" }}
            onClick={() => navigate("/candidato/editar")}
          >
            ✏️ Editar Perfil
          </button>
        </div>
      );
      default: return null;
    }
  };

  const tabTitles = {
    dashboard: "Dashboard",
    vagas: "Vagas Disponíveis",
    candidaturas: "Minhas Candidaturas",
    mensagens: "Mensagens",
    perfil: "Meu Perfil",
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {successMsg && <div style={styles.toast}>{successMsg}</div>}

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>CL</div>
          <div>
            <div style={styles.logoText}>Conecta Lagoa</div>
            <div style={styles.logoSub}>CANDIDATO</div>
          </div>
        </div>

        {NAV_ITEMS.map(item => (
          <div key={item.key} style={styles.navItem(activeTab === item.key)} onClick={() => setActiveTab(item.key)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.key === "mensagens" && msgNaoLidas > 0 && (
              <span style={styles.badge}>{msgNaoLidas}</span>
            )}
          </div>
        ))}

        <div style={styles.sidebarBottom}>
          <div style={styles.avatarRow}>
            <div style={styles.avatar}>{getInitials(user?.nome)}</div>
            <div>
              <div style={styles.userName}>{user?.nome?.split(" ")[0]}</div>
              <div style={styles.userRole}>Candidato</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate("/"); }}>
            Sair da conta
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <div style={styles.topbarTitle}>{tabTitles[activeTab]}</div>
            <div style={styles.topbarSub}>
              {activeTab === "vagas" ? `${vagas.length} vagas disponíveis` :
               activeTab === "candidaturas" ? `${candidaturas.length} candidaturas` :
               activeTab === "mensagens" ? `${msgNaoLidas} não lidas` :
               `Bem-vindo, ${user?.nome?.split(" ")[0]}!`}
            </div>
          </div>
          {activeTab === "vagas" && (
            <div style={{ fontSize: 13, color: "#888" }}>
              {candidaturas.length} vaga(s) aplicadas
            </div>
          )}
        </div>
        <div style={styles.content}>{renderContent()}</div>
      </main>
    </div>
  );
}
