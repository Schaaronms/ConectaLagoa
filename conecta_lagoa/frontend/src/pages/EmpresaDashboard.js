import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

// Removi as constantes mockadas — agora vêm do backend

const STATUS_COLOR = {
  "Aprovado": { bg: "#dcfce7", color: "#16a34a" },
  "Em Análise": { bg: "#fef3c7", color: "#d97706" },
  "Entrevista": { bg: "#dbeafe", color: "#1d4ed8" },
  "Reprovado": { bg: "#fee2e2", color: "#dc2626" },
  // adicione mais status se necessário
};

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

  // Estados para os dados reais
  const [kpis, setKpis] = useState(null);
  const [applicationsData, setApplicationsData] = useState([]);
  const [areaData, setAreaData] = useState([]);           // vagas por mês
  const [areaDistribution, setAreaDistribution] = useState([]);
  const [recentCandidates, setRecentCandidates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = { 'Content-Type': 'application/json' };
        // Se usar JWT → adicione: headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
        // Se usar cookie/session → mantenha credentials: 'include'

        const [resumo, grafico, areas, meses, recentes] = await Promise.all([
          fetch('/api/dashboard/resumo', { credentials: 'include', headers }).then(r => {
            if (!r.ok) throw new Error(`Resumo: ${r.status}`);
            return r.json();
          }),
          fetch('/api/dashboard/grafico-candidaturas', { credentials: 'include', headers }).then(r => r.json()),
          fetch('/api/dashboard/vagas-por-area', { credentials: 'include', headers }).then(r => r.json()),
          fetch('/api/dashboard/vagas-por-mes', { credentials: 'include', headers }).then(r => r.json()),
          fetch('/api/dashboard/candidatos-recentes', { credentials: 'include', headers }).then(r => r.json()),
        ]);

        // KPIs
        setKpis([
          { label: "Vagas Ativas", value: resumo.vagas_ativas.toString(), delta: `+${resumo.vagas_semana} esta semana`, icon: "💼", color: "#1a3a8f" },
          { label: "Candidaturas", value: resumo.candidaturas.toString(), delta: `+${resumo.candidaturas_hoje} hoje`, icon: "📋", color: "#e07b00" },
          { label: "Contratações", value: resumo.contratacoes.toString(), delta: `+${resumo.contratacoes_mes} este mês`, icon: "✅", color: "#10b981" },
          { 
            label: "Taxa de Conversão", 
            value: `${resumo.taxa_conversao}%`, 
            delta: `${resumo.taxa_variacao >= 0 ? '+' : ''}${resumo.taxa_variacao}% vs mês ant.`, 
            icon: "📈", 
            color: "#8b5cf6" 
          },
        ]);

        // Gráfico candidaturas vs contratações
        setApplicationsData(grafico.map(item => ({
          mes: item.mes,
          candidaturas: item.candidaturas,
          contratacoes: item.contratacoes,
        })));

        // Vagas por mês (bar)
        setAreaData(meses.map(item => ({
          mes: item.mes,
          vagas: item.total,
        })));

        // Distribuição por área (pie)
        setAreaDistribution(areas.map(item => ({
          name: item.area,
          value: item.percentual,
          color: getColorForArea(item.area), // você pode criar uma função de cor dinâmica
        })));

        // Candidatos recentes
        setRecentCandidates(recentes.map(c => ({
          name: c.nome,
          role: c.vaga_titulo,
          status: c.status,
          score: Math.floor(Math.random() * 20) + 80, // ← temporário! adicione score real no backend se quiser
          avatar: c.nome.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
        })));

      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        setError(err.message || "Falha ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Atualiza a cada 2 minutos (opcional)
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Função auxiliar para cores no pie (ajuste conforme quiser)
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontSize: 18 }}>Carregando dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: 40, color: "red", textAlign: "center" }}>Erro: {error}</div>;
  }

  // O resto do return permanece quase igual, só trocando as fontes de dados
  // ... (copie o return original daqui pra baixo, substituindo as constantes mockadas pelos estados)

  // Exemplo rápido de substituição nos cards:
  // {kpis.map((kpi, i) => ( ... value={kpi.value} delta={kpi.delta} ... ))}

  // No AreaChart: data={applicationsData}
  // No BarChart: data={areaData}
  // No PieChart: data={areaDistribution}
  // Na tabela: {recentCandidates.map(...}

  // Mantenha o resto do seu JSX (sidebar, topbar, styles, etc.)
  // ...
}