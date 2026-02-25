import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { dashboardService } from "../api/dashboard-api";

/* ============================= */
/* Helpers */
/* ============================= */

const STATUS_COLOR = {
  "Aprovado": { bg: "#dcfce7", color: "#16a34a" },
  "Em Análise": { bg: "#fef3c7", color: "#d97706" },
  "Entrevista": { bg: "#dbeafe", color: "#1d4ed8" },
  "Reprovado": { bg: "#fee2e2", color: "#dc2626" },
};

const getColorForArea = (area) => {
  const colors = {
    "Tecnologia": "#1a3a8f",
    "Comércio": "#e07b00",
    "Saúde": "#10b981",
    "Construção": "#f59e0b",
    "Outros": "#8b5cf6",
  };
  return colors[area] || "#6b7280";
};

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
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ============================= */
/* Componente Principal */
/* ============================= */

export default function ConectaLagoaDashboard() {

  const [kpis, setKpis] = useState([]);
  const [applicationsData, setApplicationsData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [areaDistribution, setAreaDistribution] = useState([]);
  const [recentCandidates, setRecentCandidates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { resumo, grafico, areas, vagasMes, candidatosRecentes } =
          await dashboardService.carregarDadosCompletos();

        /* ===== KPIs ===== */
        setKpis([
          {
            label: "Vagas Ativas",
            value: resumo.vagas_ativas,
            delta: `+${resumo.vagas_semana} esta semana`,
            icon: "💼",
            color: "#1a3a8f",
          },
          {
            label: "Candidaturas",
            value: resumo.candidaturas,
            delta: `+${resumo.candidaturas_hoje} hoje`,
            icon: "📋",
            color: "#e07b00",
          },
          {
            label: "Contratações",
            value: resumo.contratacoes,
            delta: `+${resumo.contratacoes_mes} este mês`,
            icon: "✅",
            color: "#10b981",
          },
          {
            label: "Taxa de Conversão",
            value: `${resumo.taxa_conversao}%`,
            delta: `${resumo.taxa_variacao >= 0 ? "+" : ""}${resumo.taxa_variacao}% vs mês ant.`,
            icon: "📈",
            color: "#8b5cf6",
          },
        ]);

        /* ===== Gráfico Linha ===== */
        setApplicationsData(
          grafico.map(item => ({
            mes: item.mes,
            candidaturas: item.candidaturas,
            contratacoes: item.contratacoes,
          }))
        );

        /* ===== Vagas por mês ===== */
        setAreaData(
          vagasMes.map(item => ({
            mes: item.mes,
            vagas: item.total,
          }))
        );

        /* ===== Distribuição por área ===== */
        setAreaDistribution(
          areas.map(item => ({
            name: item.area,
            value: item.percentual,
            color: getColorForArea(item.area),
          }))
        );

        /* ===== Candidatos recentes ===== */
        setRecentCandidates(
          candidatosRecentes.map(c => ({
            name: c.nome,
            role: c.vaga_titulo,
            status: c.status,
            avatar: c.nome
              .split(" ")
              .map(n => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          }))
        );

      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        setError(err.message || "Falha ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);

  }, []);

  /* ============================= */
  /* Estados de Tela */
  /* ============================= */

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Carregando dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: 40, color: "red", textAlign: "center" }}>Erro: {error}</div>;
  }

  /* ============================= */
  /* Render */
  /* ============================= */

  return (
    <div style={{ padding: 30 }}>

      <h2>Dashboard Conecta Lagoa</h2>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
        {kpis.map((kpi, index) => (
          <div key={index} style={{
            flex: 1,
            padding: 20,
            borderRadius: 16,
            background: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: 14, color: "#666" }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Gráfico Área */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={applicationsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="candidaturas" stroke="#1a3a8f" fill="#1a3a8f33" />
          <Area type="monotone" dataKey="contratacoes" stroke="#10b981" fill="#10b98133" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Gráfico Barra */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={areaData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="vagas" fill="#e07b00" />
        </BarChart>
      </ResponsiveContainer>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={areaDistribution}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {areaDistribution.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

    </div>
  );
}