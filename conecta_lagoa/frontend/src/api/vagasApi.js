// src/api/vagasApi.js

// Dados mock (exemplos de vagas para testar o frontend sem backend)
const mockVagas = [
  {
    id: 1,
    titulo: "Auxiliar de Produção",
    empresa: "Indústria Alimentícia LTDA",
    local: "Lagoa Vermelha, RS",
    modelo: "presencial",
    tipo: "CLT",
    salario: "R$ 1.800 - R$ 2.200",
    descricao: "Atuação na linha de produção, controle de qualidade e embalagem de produtos alimentícios. Escala 6x1.",
    descricaoCompleta: "Responsabilidades:\n- Operar máquinas simples\n- Separar e embalar produtos\n- Manter limpeza do posto de trabalho\nRequisitos:\n- Ensino fundamental completo\n- Disponibilidade de horário\nDiferenciais: Experiência em indústria",
    pcd: false
  },
  {
    id: 2,
    titulo: "Vendedor Externo",
    empresa: "Distribuidora ABC",
    local: "Lagoa Vermelha e região",
    modelo: "hibrido",
    tipo: "PJ",
    salario: "R$ 2.500 + comissão",
    descricao: "Prospecção e atendimento a clientes da região. Carteira de moto e CNH B obrigatórias.",
    descricaoCompleta: "Atividades:\n- Visitar clientes\n- Fechar vendas\n- Fazer cobranças\nRequisitos:\n- Experiência em vendas\n- Veículo próprio\nBenefícios: Comissão atrativa + vale combustível",
    pcd: false
  },
  {
    id: 3,
    titulo: "Recepcionista Bilíngue",
    empresa: "Hotel & Turismo",
    local: "Passo Fundo, RS",
    modelo: "presencial",
    tipo: "CLT",
    salario: "R$ 2.000 + benefícios",
    descricao: "Atendimento ao público, reservas e suporte administrativo. Necessário inglês intermediário.",
    descricaoCompleta: "Funções:\n- Receber hóspedes\n- Gerenciar check-in/out\n- Atender telefones\nRequisitos:\n- Inglês conversação\n- Boa apresentação\n- Experiência em recepção",
    pcd: true
  }
  // Você pode adicionar mais objetos aqui conforme necessário
];

export const fetchVagas = async (params = {}) => {
  // Simula delay de rede para ver o loading na tela (opcional, pode remover depois)
  await new Promise(resolve => setTimeout(resolve, 800));

  // Começa com todas as vagas
  let filtered = [...mockVagas];

  // Filtro por termo de busca (título, empresa ou descrição)
  if (params.search && params.search.trim()) {
    const term = params.search.toLowerCase().trim();
    filtered = filtered.filter(vaga =>
      vaga.titulo.toLowerCase().includes(term) ||
      vaga.empresa?.toLowerCase().includes(term) ||
      vaga.descricao.toLowerCase().includes(term) ||
      vaga.descricaoCompleta?.toLowerCase().includes(term)
    );
  }

  // Filtros dos selects e checkbox
  if (params.local) {
    filtered = filtered.filter(v =>
      v.local?.toLowerCase().includes(params.local.toLowerCase())
    );
  }

  if (params.modelo) {
    filtered = filtered.filter(v => v.modelo === params.modelo);
  }

  if (params.tipo) {
    filtered = filtered.filter(v => v.tipo === params.tipo);
  }

  // PCD: só mostra vagas que são PCD quando o filtro está marcado
  if (params.pcd === true || params.pcd === 'true') {
    filtered = filtered.filter(v => v.pcd === true);
  }

  return filtered;
};