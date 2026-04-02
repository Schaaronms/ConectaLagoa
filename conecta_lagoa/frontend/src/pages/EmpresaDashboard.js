import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PanelOverview from './panels/PanelOverview';
// Importe outros panels se precisar (vou manter só overview por enquanto, você pode adicionar depois)

import { V, BASE_URL } from './panels/shared';

export default function EmpresaDashboard() {
  const { user } = useAuth();
  const [modal, setModal] = useState(false);
  const [modalVaga, setModalVaga] = useState(false);

  const [kpis, setKpis] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [evolucao, setEvolucao] = useState([]);
  const [funil, setFunil] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    try {
      const get = async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        return res.ok ? res.json() : null;
      };

      const [resumo, cands, evolucaoData, funilData, alertasData] = await Promise.all([
        get('/dashboard/resumo'),
        get('/dashboard/candidatos-recentes'),
        get('/dashboard/evolucao-mensal'),
        get('/dashboard/funil'),
        get('/dashboard/alertas'),
      ]);

      const r = resumo?.data || resumo || {};

      setKpis([
        { label: 'Vagas Abertas', value: r.vagas_ativas || 0, delta: `+${r.vagas_semana || 0}`, deltaUp: true, color: 'green' },
        { label: 'Candidatos no Pipeline', value: r.candidaturas || 0, delta: `+${r.candidaturas_hoje || 0} hoje`, deltaUp: true, color: 'green' },
        { label: 'Taxa de Matching IA', value: `${r.taxa_conversao || 0}%`, delta: `${r.taxa_variacao || 0}%`, deltaUp: (r.taxa_variacao || 0) >= 0, color: 'emerald' },
        { label: 'Tempo Médio Contratação', value: `${r.tempo_medio || '—'} dias`, delta: 'vs mês ant.', deltaUp: false, color: 'amber' },
        { label: 'Custo por Contratação', value: `R$ ${r.custo_medio || '—'}`, delta: 'vs mês ant.', deltaUp: false, color: 'emerald' },
      ]);

      if (cands) setCandidates(cands.data || cands);
      if (evolucaoData) setEvolucao(evolucaoData);
      if (funilData) setFunil(funilData);
      if (alertasData) setAlertas(alertasData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const initials = user?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

  // Nova Sidebar (mais parecida com Axia)
  const sidebarItems = [
    { id: 'overview', label: 'Painel', icon: '📊' },
    { id: 'vagas', label: 'Vagas', icon: '📋' },
    { id: 'talent', label: 'Banco de Talentos', icon: '👥' },
    { id: 'funnel', label: 'Funil CRM', icon: '📈' },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'ai', label: 'Copiloto IA', icon: '✨' },
    { id: 'reports', label: 'Relatórios', icon: '📊' },
    { id: 'colaboradores', label: 'Colaboradores', icon: '👔' },
  ];

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-gray-900">Conecta Lagoa</h1>
              <p className="text-xs text-gray-500">Recrutamento Local</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.nome || 'Empresa'}</p>
              <p className="text-gray-500 text-xs">Recrutador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar estilo Axia */}
        <div className="h-16 border-b bg-white px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Bom dia, {user?.nome?.split(' ')[0] || 'Schaaron'}
            </h2>
            <p className="text-sm text-gray-500">
              Hoje é {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border rounded-full px-4 py-1.5 text-sm text-gray-500">
              Últimos 30 dias
              <span className="text-xs">▼</span>
            </div>

            <button 
              onClick={() => setModalVaga(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 transition"
            >
              + Nova Vaga
            </button>

            <button 
              onClick={() => setModal(true)}
              className="px-5 py-2.5 border rounded-2xl flex items-center gap-2 hover:bg-gray-50"
            >
              🔔 Lembrete
            </button>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="px-8 pt-6 pb-4 border-b bg-white">
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Nova Vaga', icon: '📝' },
              { label: 'Importar Currículos', icon: '📤' },
              { label: 'Copiloto IA', icon: '🤖' },
              { label: 'Ver Funil', icon: '📊' },
              { label: 'Relatórios', icon: '📈' },
            ].map((action, i) => (
              <button key={i} className="flex items-center gap-2 bg-white border hover:border-blue-200 px-5 py-3 rounded-2xl text-sm font-medium transition hover:shadow">
                <span>{action.icon}</span> {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Carregando dados...</p>
            </div>
          ) : activeTab === 'overview' ? (
            <PanelOverview 
              kpis={kpis} 
              candidates={candidates}
              evolucao={evolucao}
              funil={funil}
              alertas={alertas}
            />
          ) : (
            <div className="text-center py-20 text-gray-400">
              Em breve: {sidebarItems.find(i => i.id === activeTab)?.label}
            </div>
          )}
        </div>
      </div>

      {/* Seus modais continuam iguais */}
      {/* <Modal ... /> e <ModalNovaVaga ... /> */}
    </div>
  );
}