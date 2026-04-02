import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import PanelOverview from './panels/PanelOverview';
import PanelVagas from './panels/PanelVagas';
import PanelTalent from './panels/PanelTalent';
import PanelFunilCRM from './PanelFunil';
import PanelAgendaFull from './PanelAgenda';
import PanelAI from './panels/PanelAI';
import PanelReports from './panels/PanelReports';
import PanelColaboradores from './panels/PanelColaboradores';

import { BASE_URL } from './panels/shared';

const sidebarItems = [
  { id: 'overview',      label: 'Painel',            icon: '📊' },
  { id: 'vagas',         label: 'Vagas',             icon: '📋' },
  { id: 'talent',        label: 'Banco de Talentos', icon: '👥' },
  { id: 'funnel',        label: 'Funil CRM',         icon: '📈' },
  { id: 'agenda',        label: 'Agenda',            icon: '📅' },
  { id: 'ai',            label: 'Copiloto IA',       icon: '✨' },
  { id: 'reports',       label: 'Relatórios',        icon: '📊' },
  { id: 'colaboradores', label: 'Colaboradores',     icon: '👔' },
];

export default function EmpresaDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [evolucao, setEvolucao] = useState([]);
  const [funil, setFunil] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalVaga, setModalVaga] = useState(false);

  // Busca de dados
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const get = async (path) => {
          const res = await fetch(`${BASE_URL}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
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
          { label: 'Vagas abertas',           value: r.vagas_ativas || 0,            delta: `+${r.vagas_semana || 0} esta semana`, up: true },
          { label: 'Candidatos no pipeline',  value: r.candidaturas || 0,            delta: `+${r.candidaturas_hoje || 0} hoje`,      up: true },
          { label: 'Taxa de matching IA',     value: `${r.taxa_conversao || 0}%`,    delta: `${r.taxa_variacao || 0}%`,               up: (r.taxa_variacao || 0) >= 0 },
          { label: 'Tempo médio contratação', value: `${r.tempo_medio || '—'} dias`, delta: 'vs mês ant.',                           up: false },
          { label: 'Custo por contratação',   value: `R$ ${r.custo_medio || '—'}`,   delta: 'vs mês ant.',                           up: false },
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

    fetchData();
  }, []);

  const initials = user?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">CL</div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">Conecta Lagoa</h1>
              <p className="text-xs text-gray-500">Recrutamento Local</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-2xl">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.nome || 'Recrutador'}</p>
              <p className="text-xs text-gray-500">Empresa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Bom dia, {user?.nome?.split(' ')[0] || 'Nova'}
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border rounded-full px-5 py-2 text-sm text-gray-500">
              Últimos 30 dias ▼
            </div>

            <button 
              onClick={() => setModalVaga(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-medium flex items-center gap-2 transition"
            >
              + Nova Vaga
            </button>

            <button 
              onClick={() => setModal(true)}
              className="px-6 py-2.5 border border-gray-300 rounded-2xl hover:bg-gray-50 transition"
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
              <button 
                key={i}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 px-6 py-3 rounded-2xl text-sm font-medium hover:shadow transition"
              >
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
          ) : (
            <>
              {activeTab === 'overview' && <PanelOverview kpis={kpis} candidates={candidates} evolucao={evolucao} funil={funil} alertas={alertas} />}
              {activeTab === 'vagas' && <PanelVagas />}
              {activeTab === 'talent' && <PanelTalent />}
              {activeTab === 'funnel' && <PanelFunilCRM />}
              {activeTab === 'agenda' && <PanelAgendaFull />}
              {activeTab === 'ai' && <PanelAI />}
              {activeTab === 'reports' && <PanelReports />}
              {activeTab === 'colaboradores' && <PanelColaboradores />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}