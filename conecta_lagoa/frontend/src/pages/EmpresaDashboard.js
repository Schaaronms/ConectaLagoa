import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { dashboardService, apiFetch } from "../api/dashboard-api";

/* ============================= */
/* Helpers */
/* ============================= */

const STATUS_COLOR = {
  "pendente":    { bg: "#fef3c7", color: "#d97706" },
  "em_analise":  { bg: "#dbeafe", color: "#1d4ed8" },
  "entrevista":  { bg: "#e0e7ff", color: "#7c3aed" },
  "aprovado":    { bg: "#dcfce7", color: "#16a34a" },
  "reprovado":   { bg: "#fee2e2", color: "#dc2626" },
  "contratado":  { bg: "#d1fae5", color: "#059669" },
};

const STATUS_LABEL = {
  "pendente":   "Pendente",
  "em_analise": "Em Análise",
  "entrevista": "Entrevista",
  "aprovado":   "Aprovado",
  "reprovado":  "Reprovado",
  "contratado": "Contratado",
};

const getColorForArea = (area) => {
  const colors = {
    "Tecnologia": "#1a3a8f", "Comércio": "#e07b00",
    "Saúde": "#10b981", "Construção": "#f59e0b", "Outros": "#8b5cf6",
  };
  return colors[area] || "#6b7280";
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"white", border:"1px solid #e8ecf4", borderRadius:12,
      padding:"12px 16px", boxShadow:"0 8px 24px rgba(26,58,143,0.1)", fontSize:13 }}>
      <p style={{ fontWeight:700, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

/* ============================= */
/* Modal Criar/Editar Vaga */
/* ============================= */

function ModalVaga({ vaga, onClose, onSalvo }) {
  const [form, setForm] = useState({
    titulo: vaga?.titulo || "",
    descricao: vaga?.descricao || "",
    requisitos: vaga?.requisitos || "",
    salario: vaga?.salario || "",
    cidade: vaga?.cidade || "",
    tipo_contrato: vaga?.tipo_contrato || "CLT",
    area: vaga?.area || "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleSubmit = async () => {
    if (!form.titulo.trim()) { setErro("Título é obrigatório."); return; }
    setSalvando(true); setErro(null);
    try {
      if (vaga) {
        await apiFetch(`/empresa/vagas/${vaga.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await apiFetch("/empresa/vagas", { method: "POST", body: JSON.stringify(form) });
      }
      onSalvo();
    } catch (e) {
      setErro(e.message || "Erro ao salvar vaga.");
    } finally {
      setSalvando(false);
    }
  };

  const campo = (label, key, tipo = "text", opções = null) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:4, color:"#374151" }}>{label}</label>
      {opções ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14 }}>
          {opções.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : tipo === "textarea" ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={3} style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14, resize:"vertical" }} />
      ) : (
        <input type={tipo} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14 }} />
      )}
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"white", borderRadius:16, padding:28, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin:"0 0 20px", fontSize:18, fontWeight:700 }}>{vaga ? "Editar Vaga" : "Nova Vaga"}</h3>
        {campo("Título da Vaga *", "titulo")}
        {campo("Área", "area", "text")}
        {campo("Descrição", "descricao", "textarea")}
        {campo("Requisitos", "requisitos", "textarea")}
        {campo("Salário", "salario")}
        {campo("Cidade", "cidade")}
        {campo("Tipo de Contrato", "tipo_contrato", "select", ["CLT", "PJ", "Estágio", "Temporário", "Freelancer"])}
        {erro && <p style={{ color:"#dc2626", fontSize:13, marginBottom:12 }}>{erro}</p>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, border:"1px solid #d1d5db", background:"white", cursor:"pointer", fontWeight:600 }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#1a3a8f", color:"white", cursor:"pointer", fontWeight:600 }}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================= */
/* Aba Vagas */
/* ============================= */

function AbaVagas() {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [vagaEditando, setVagaEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/empresa/vagas");
      setVagas(res?.vagas || res?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const excluir = async (id) => {
    try {
      await apiFetch(`/empresa/vagas/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      carregar();
    } catch (e) {
      alert("Erro ao excluir vaga.");
    }
  };

  const toggleAtiva = async (vaga) => {
    try {
      await apiFetch(`/empresa/vagas/${vaga.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...vaga, ativa: !vaga.ativa })
      });
      carregar();
    } catch (e) { alert("Erro ao atualizar vaga."); }
  };

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#6b7280" }}>Carregando vagas...</div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>Minhas Vagas ({vagas.length})</h3>
        <button onClick={() => { setVagaEditando(null); setModalAberto(true); }}
          style={{ padding:"10px 20px", background:"#1a3a8f", color:"white", border:"none", borderRadius:10, fontWeight:600, cursor:"pointer", fontSize:14 }}>
          + Nova Vaga
        </button>
      </div>

      {vagas.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#9ca3af" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>💼</div>
          <p style={{ fontSize:16 }}>Nenhuma vaga cadastrada ainda.</p>
          <p style={{ fontSize:14 }}>Clique em "Nova Vaga" para começar!</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {vagas.map(v => (
            <div key={v.id} style={{ background:"white", borderRadius:12, padding:"16px 20px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>{v.titulo}</span>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20,
                    background: v.ativa ? "#dcfce7" : "#f3f4f6",
                    color: v.ativa ? "#16a34a" : "#6b7280", fontWeight:600 }}>
                    {v.ativa ? "Ativa" : "Encerrada"}
                  </span>
                </div>
                <div style={{ fontSize:13, color:"#6b7280" }}>
                  {[v.area, v.cidade, v.tipo_contrato, v.salario].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => toggleAtiva(v)}
                  style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #d1d5db",
                    background:"white", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  {v.ativa ? "Encerrar" : "Reativar"}
                </button>
                <button onClick={() => { setVagaEditando(v); setModalAberto(true); }}
                  style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #1a3a8f",
                    background:"white", color:"#1a3a8f", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  Editar
                </button>
                <button onClick={() => setConfirmDelete(v.id)}
                  style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #dc2626",
                    background:"white", color:"#dc2626", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <ModalVaga vaga={vagaEditando} onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar(); }} />
      )}

      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"white", borderRadius:16, padding:28, maxWidth:380, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <h3 style={{ margin:"0 0 8px" }}>Excluir vaga?</h3>
            <p style={{ color:"#6b7280", marginBottom:20 }}>Esta ação não pode ser desfeita.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding:"9px 20px", borderRadius:8, border:"1px solid #d1d5db", background:"white", cursor:"pointer", fontWeight:600 }}>Cancelar</button>
              <button onClick={() => excluir(confirmDelete)}
                style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#dc2626", color:"white", cursor:"pointer", fontWeight:600 }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================= */
/* Aba Candidatos */
/* ============================= */

function AbaCandidatos() {
  const [dados, setDados] = useState([]);
  const [vagaSelecionada, setVagaSelecionada] = useState("todas");
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [resVagas, resCand] = await Promise.all([
        apiFetch("/empresa/vagas"),
        apiFetch("/empresa/candidatos-vagas"),
      ]);
      setVagas(resVagas?.vagas || resVagas?.data || []);
      setDados(resCand?.dados || resCand?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const candidatosFiltrados = vagaSelecionada === "todas"
    ? dados
    : dados.filter(d => String(d.vaga_id) === String(vagaSelecionada));

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#6b7280" }}>Carregando candidatos...</div>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>Candidatos</h3>
        <select value={vagaSelecionada} onChange={e => setVagaSelecionada(e.target.value)}
          style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14 }}>
          <option value="todas">Todas as vagas</option>
          {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
        </select>
      </div>

      {candidatosFiltrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#9ca3af" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
          <p style={{ fontSize:16 }}>Nenhum candidato ainda.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {candidatosFiltrados.map((d, i) => (
            <div key={i} style={{ background:"white", borderRadius:12, padding:"16px 20px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:"#e0e7ff",
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#1a3a8f", fontSize:15, flexShrink:0 }}>
                {(d.nome || "?").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{d.nome || "—"}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{d.email} {d.cidade ? `· ${d.cidade}` : ""}</div>
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>Vaga: {d.titulo || d.vaga_titulo || "—"}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {d.status && (
                  <span style={{ fontSize:12, padding:"3px 10px", borderRadius:20, fontWeight:600,
                    background: STATUS_COLOR[d.status]?.bg || "#f3f4f6",
                    color: STATUS_COLOR[d.status]?.color || "#374151" }}>
                    {STATUS_LABEL[d.status] || d.status}
                  </span>
                )}
                <span style={{ fontSize:12, color:"#6b7280" }}>
                  {d.total_candidatos != null ? `${d.total_candidatos} candidato(s)` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================= */
/* Aba Overview (gráficos) */
/* ============================= */

function AbaOverview() {
  const [kpis, setKpis] = useState([]);
  const [applicationsData, setApplicationsData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [areaDistribution, setAreaDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const raw = await dashboardService.carregarDadosCompletos();
        const resumo = raw.resumo?.data || raw.resumo || {};
        const grafico = raw.grafico?.data || raw.grafico || [];
        const areas = raw.areas?.data || raw.areas || [];
        const vagasMes = raw.vagasMes?.data || raw.vagasMes || [];

        setKpis([
          { label:"Vagas Ativas",       value: resumo.vagas_ativas,    delta:`+${resumo.vagas_semana||0} esta semana`,     icon:"💼", color:"#1a3a8f" },
          { label:"Candidaturas",        value: resumo.candidaturas,    delta:`+${resumo.candidaturas_hoje||0} hoje`,        icon:"📋", color:"#e07b00" },
          { label:"Contratações",        value: resumo.contratacoes,    delta:`+${resumo.contratacoes_mes||0} este mês`,     icon:"✅", color:"#10b981" },
          { label:"Taxa de Conversão",   value:`${resumo.taxa_conversao||0}%`, delta:`${resumo.taxa_variacao>=0?"+":""}${resumo.taxa_variacao||0}% vs mês ant.`, icon:"📈", color:"#8b5cf6" },
        ]);
        setApplicationsData(grafico.map(i => ({ mes:i.mes, candidaturas:i.candidaturas, contratacoes:i.contratacoes })));
        setAreaData(vagasMes.map(i => ({ mes:i.mes, vagas:i.total })));
        setAreaDistribution(areas.map(i => ({ name:i.area, value:i.percentual, color:getColorForArea(i.area) })));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const t = setInterval(fetch, 120000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#6b7280" }}>Carregando dados...</div>;
  if (error) return <div style={{ padding:40, color:"#dc2626", textAlign:"center" }}>Erro: {error}</div>;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:"flex", gap:16, marginBottom:32, flexWrap:"wrap" }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ flex:"1 1 180px", padding:20, borderRadius:16, background:"white",
            boxShadow:"0 4px 16px rgba(0,0,0,0.06)", borderLeft:`4px solid ${kpi.color}` }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{kpi.icon}</div>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:4 }}>{kpi.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:"#111" }}>{kpi.value ?? 0}</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div style={{ background:"white", borderRadius:16, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
          <h4 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#374151" }}>Candidaturas vs Contratações</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={applicationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize:12 }} />
              <YAxis tick={{ fontSize:12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="candidaturas" stroke="#1a3a8f" fill="#1a3a8f22" name="Candidaturas" />
              <Area type="monotone" dataKey="contratacoes" stroke="#10b981" fill="#10b98122" name="Contratações" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:"white", borderRadius:16, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
          <h4 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#374151" }}>Vagas por Mês</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize:12 }} />
              <YAxis tick={{ fontSize:12 }} />
              <Tooltip />
              <Bar dataKey="vagas" fill="#e07b00" radius={[4,4,0,0]} name="Vagas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {areaDistribution.length > 0 && (
        <div style={{ background:"white", borderRadius:16, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
          <h4 style={{ margin:"0 0 16px", fontSize:14, fontWeight:700, color:"#374151" }}>Vagas por Área</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={areaDistribution} dataKey="value" nameKey="name" outerRadius={80} label={({ name, value }) => `${name} ${value}%`}>
                {areaDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ============================= */
/* Componente Principal */
/* ============================= */

export default function ConectaLagoaDashboard() {
  const [aba, setAba] = useState("overview");

  const abas = [
    { id:"overview",    label:"📊 Visão Geral" },
    { id:"vagas",       label:"💼 Vagas" },
    { id:"candidatos",  label:"👥 Candidatos" },
  ];

  return (
    <div style={{ padding:"24px 32px", maxWidth:1200, margin:"0 auto" }}>
      <h2 style={{ margin:"0 0 24px", fontSize:22, fontWeight:800, color:"#111" }}>Dashboard Conecta Lagoa</h2>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:28, borderBottom:"2px solid #e5e7eb", paddingBottom:0 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{
              padding:"10px 20px", border:"none", background:"none", cursor:"pointer",
              fontSize:14, fontWeight: aba === a.id ? 700 : 500,
              color: aba === a.id ? "#1a3a8f" : "#6b7280",
              borderBottom: aba === a.id ? "2px solid #1a3a8f" : "2px solid transparent",
              marginBottom:"-2px", transition:"all 0.15s"
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "overview"   && <AbaOverview />}
      {aba === "vagas"      && <AbaVagas />}
      {aba === "candidatos" && <AbaCandidatos />}
    </div>
  );
}
