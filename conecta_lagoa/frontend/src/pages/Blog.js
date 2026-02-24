import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import './Blog.css';

// ─── CONFIG STRAPI ───────────────────────────────────────────
// Quando o Strapi estiver rodando, troque para a URL do seu servidor
// Ex: 'http://localhost:1337' em dev, ou 'https://seusite.com/strapi' em prod
const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337';

// ─── DADOS DE EXEMPLO (usados enquanto o Strapi não está configurado) ───
const ARTIGOS_EXEMPLO = [
  {
    id: 1,
    titulo: "Como montar um currículo que chama atenção em 2025",
    descricao: "Dicas práticas para destacar suas habilidades e conquistar a vaga dos seus sonhos no mercado local.",
    conteudo: `Um bom currículo é sua porta de entrada para qualquer processo seletivo. Neste artigo, vamos explorar as principais dicas para criar um documento que realmente impressione os recrutadores.\n\n**1. Seja objetivo e claro**\nRecrutadores gastam em média 6 segundos olhando para um currículo. Por isso, coloque as informações mais importantes primeiro.\n\n**2. Personalize para cada vaga**\nAdapte o currículo para cada empresa. Leia o anúncio com atenção e destaque as experiências que mais se encaixam.\n\n**3. Destaque resultados, não só responsabilidades**\nEm vez de "responsável pelo setor de vendas", escreva "aumentei as vendas em 30% em 6 meses".\n\n**4. Use um formato limpo**\nEvite cores excessivas e fontes muito elaboradas. Clareza é mais importante que design.\n\n**5. Revise antes de enviar**\nErros de português causam péssima impressão. Peça para alguém revisar antes de enviar.`,
    categoria: "carreira",
    autor: "Equipe Conecta",
    data: "2025-01-15",
    emoji: "📄",
    destaque: true,
    tempo_leitura: "5 min",
  },
  {
    id: 2,
    titulo: "Mercado de trabalho em Lagoa da Prata: tendências para 2025",
    descricao: "Quais setores estão contratando mais na nossa região e como se preparar para aproveitar as oportunidades.",
    conteudo: "O mercado de trabalho da nossa região está aquecido em alguns setores específicos. Saúde, tecnologia e varejo lideram as contratações em 2025.\n\nAs empresas buscam cada vez mais profissionais com habilidades digitais, mesmo para funções tradicionais. Saber usar ferramentas como Excel, WhatsApp Business e redes sociais pode ser um diferencial importante.",
    categoria: "mercado",
    autor: "Ana Costa",
    data: "2025-01-10",
    emoji: "📊",
    destaque: false,
    tempo_leitura: "4 min",
  },
  {
    id: 3,
    titulo: "Entrevista de emprego: como se preparar e impressionar",
    descricao: "Os erros mais comuns em entrevistas e como evitá-los para garantir sua vaga.",
    conteudo: "A entrevista de emprego é o momento mais importante do processo seletivo. A preparação faz toda a diferença entre ser aprovado ou reprovado.\n\nPesquise sobre a empresa antes da entrevista. Mostre que você conhece os valores e produtos deles. Isso demonstra interesse genuíno.",
    categoria: "dicas",
    autor: "Carlos Lima",
    data: "2025-01-08",
    emoji: "🎯",
    destaque: false,
    tempo_leitura: "6 min",
  },
  {
    id: 4,
    titulo: "Como as empresas locais estão usando tecnologia para contratar",
    descricao: "A transformação digital chegou ao RH das pequenas e médias empresas da região.",
    conteudo: "As pequenas e médias empresas de Lagoa da Prata estão adotando ferramentas digitais para otimizar seus processos de recrutamento. Plataformas como o Conecta Lagoa facilitam a conexão entre candidatos e empresas de forma rápida e eficiente.",
    categoria: "empresas",
    autor: "Marcos Oliveira",
    data: "2025-01-05",
    emoji: "🏢",
    destaque: false,
    tempo_leitura: "3 min",
  },
  {
    id: 5,
    titulo: "Trabalho remoto: oportunidades além da região",
    descricao: "Como profissionais de Lagoa da Prata podem conseguir vagas remotas em empresas de todo o Brasil.",
    conteudo: "O trabalho remoto abriu um novo mundo de oportunidades para profissionais que vivem fora dos grandes centros. Hoje é possível trabalhar para empresas de São Paulo, Rio ou até do exterior sem sair de Lagoa da Prata.\n\nPara conseguir vagas remotas, foque em desenvolver habilidades digitais e construir um portfólio online.",
    categoria: "carreira",
    autor: "Julia Mendes",
    data: "2025-01-03",
    emoji: "💻",
    destaque: false,
    tempo_leitura: "5 min",
  },
  {
    id: 6,
    titulo: "Novas vagas abertas: conheça as empresas que estão contratando",
    descricao: "Confira as empresas que mais abriram vagas no Conecta Lagoa neste mês.",
    conteudo: "Janeiro de 2025 começou movimentado no mercado de trabalho local. Diversas empresas estão ampliando suas equipes e buscando talentos na região.\n\nOs setores de saúde e tecnologia lideram as contratações, mas varejo e serviços também apresentam boas oportunidades.",
    categoria: "noticias",
    autor: "Redação",
    data: "2025-01-01",
    emoji: "📢",
    destaque: false,
    tempo_leitura: "2 min",
  },
];

const CATEGORIAS = [
  { key: "todas",    label: "Todas"      },
  { key: "carreira", label: "🎓 Carreira" },
  { key: "dicas",    label: "💡 Dicas"    },
  { key: "mercado",  label: "📈 Mercado"  },
  { key: "empresas", label: "🏢 Empresas" },
  { key: "noticias", label: "📢 Notícias" },
];

const getCatBadgeClass = (cat) => `blog-card-category cat-badge-${cat}`;
const getCatImgClass   = (cat) => `blog-card-img cat-${cat}`;

// ─── COMPONENTE CARD ─────────────────────────────────────────
function BlogCard({ artigo, onClick, delay = 0 }) {
  return (
    <div
      className="blog-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onClick(artigo)}
    >
      <div className={getCatImgClass(artigo.categoria)}>
        <span>{artigo.emoji}</span>
      </div>
      <div className="blog-card-body">
        <span className={getCatBadgeClass(artigo.categoria)}>
          {CATEGORIAS.find(c => c.key === artigo.categoria)?.label.replace(/[^\w\s]/g, '').trim() || artigo.categoria}
        </span>
        <div className="blog-card-title">{artigo.titulo}</div>
        <p className="blog-card-desc">{artigo.descricao}</p>
        <div className="blog-card-footer">
          <div className="blog-card-author">
            <div className="blog-card-avatar">{artigo.autor[0]}</div>
            <div>
              <div className="blog-card-author-name">{artigo.autor}</div>
              <div className="blog-card-date">
                {new Date(artigo.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
          <span className="blog-card-read">⏱ {artigo.tempo_leitura}</span>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function Blog() {
  const [artigos, setArtigos]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [busca, setBusca]                   = useState('');
  const [buscaInput, setBuscaInput]         = useState('');
  const [categoria, setCategoria]           = useState('todas');
  const [artigoSelecionado, setArtigoSelecionado] = useState(null);
  const [usandoStrapi, setUsandoStrapi]     = useState(false);

  // Busca do Strapi ou usa dados de exemplo
  const fetchArtigos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        'populate': '*',
        'sort': 'createdAt:desc',
        ...(categoria !== 'todas' && { 'filters[categoria][$eq]': categoria }),
        ...(busca && { 'filters[titulo][$containsi]': busca }),
      });

      const res = await fetch(`${STRAPI_URL}/api/artigos?${params}`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) throw new Error('Strapi indisponível');

      const json = await res.json();

      // Adapta formato do Strapi para o formato do componente
      const adaptados = json.data.map(item => ({
        id:            item.id,
        titulo:        item.attributes.titulo,
        descricao:     item.attributes.descricao,
        conteudo:      item.attributes.conteudo,
        categoria:     item.attributes.categoria,
        autor:         item.attributes.autor,
        data:          item.attributes.publishedAt || item.attributes.createdAt,
        emoji:         item.attributes.emoji || '📝',
        destaque:      item.attributes.destaque || false,
        tempo_leitura: item.attributes.tempo_leitura || '3 min',
      }));

      setArtigos(adaptados);
      setUsandoStrapi(true);

    } catch {
      // Strapi não disponível → usa dados de exemplo
      let filtrados = ARTIGOS_EXEMPLO;
      if (categoria !== 'todas') filtrados = filtrados.filter(a => a.categoria === categoria);
      if (busca) filtrados = filtrados.filter(a =>
        a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        a.descricao.toLowerCase().includes(busca.toLowerCase())
      );
      setArtigos(filtrados);
      setUsandoStrapi(false);
    } finally {
      setLoading(false);
    }
  }, [categoria, busca]);

  useEffect(() => { fetchArtigos(); }, [fetchArtigos]);

  // Debounce na busca
  useEffect(() => {
    const t = setTimeout(() => setBusca(buscaInput), 500);
    return () => clearTimeout(t);
  }, [buscaInput]);

  const artigoDestaque = artigos.find(a => a.destaque) || artigos[0];
  const demaisArtigos  = artigos.filter(a => a.id !== artigoDestaque?.id);

  return (
    <div className="blog-page">

      {/* HERO */}
      <section className="blog-hero">
        <div className="blog-hero-grid" />
        <div className="blog-hero-content">
          <div className="blog-hero-badge">
            <div className="blog-hero-badge-dot" />
            Dicas, novidades e oportunidades
          </div>
          <h1>Blog Conecta Lagoa</h1>
          <p>Conteúdo para impulsionar sua carreira e manter você atualizado sobre o mercado local</p>

          {/* BUSCA */}
          <div className="blog-searchbar-wrapper">
            <Search className="blog-searchbar-icon" />
            <input
              type="text"
              className="blog-searchbar-input"
              placeholder="Buscar artigos..."
              value={buscaInput}
              onChange={e => setBuscaInput(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <div className="blog-filters-bar">
        <div className="blog-filters-inner">
          {CATEGORIAS.map(cat => (
            <button
              key={cat.key}
              className={`blog-filter-btn${categoria === cat.key ? ' active' : ''}`}
              onClick={() => setCategoria(cat.key)}
            >
              {cat.label}
            </button>
          ))}
          <span className="blog-total">{artigos.length} artigos</span>
        </div>
      </div>

      {/* CONTEÚDO */}
      <section className="blog-section">

        {!usandoStrapi && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10,
            padding: '10px 16px', fontSize: 13, color: '#92400e', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            ⚠️ <strong>Modo demonstração</strong> — configure o Strapi para gerenciar artigos reais.
            <a href="#strapi-setup" style={{ color: '#1a3a8f', fontWeight: 700, marginLeft: 4 }}>
              Ver instruções ↓
            </a>
          </div>
        )}

        {loading ? (
          <div className="blog-loading">
            <div className="blog-spinner" />
            <p>Carregando artigos...</p>
          </div>

        ) : artigos.length === 0 ? (
          <div className="blog-empty">
            <div className="blog-empty-icon">🔍</div>
            <h3>Nenhum artigo encontrado</h3>
            <p>Tente outro termo ou categoria.</p>
          </div>

        ) : (
          <>
            {/* DESTAQUE */}
            {artigoDestaque && (
              <>
                <div className="blog-section-title">⭐ Em destaque</div>
                <div className="blog-featured" onClick={() => setArtigoSelecionado(artigoDestaque)}>
                  <div className="blog-featured-img">
                    <span>{artigoDestaque.emoji}</span>
                  </div>
                  <div className="blog-featured-body">
                    <div className="blog-featured-label">
                      ✦ {CATEGORIAS.find(c => c.key === artigoDestaque.categoria)?.label || artigoDestaque.categoria}
                    </div>
                    <div className="blog-featured-title">{artigoDestaque.titulo}</div>
                    <p className="blog-featured-desc">{artigoDestaque.descricao}</p>
                    <div className="blog-featured-meta">
                      <div className="blog-featured-avatar">{artigoDestaque.autor[0]}</div>
                      <div>
                        <div className="blog-featured-author">{artigoDestaque.autor}</div>
                        <div className="blog-featured-date">
                          {new Date(artigoDestaque.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {' · '}{artigoDestaque.tempo_leitura} de leitura
                        </div>
                      </div>
                    </div>
                    <button className="blog-featured-btn">Ler artigo completo →</button>
                  </div>
                </div>
              </>
            )}

            {/* GRID */}
            {demaisArtigos.length > 0 && (
              <>
                <div className="blog-section-title" style={{ marginTop: 36 }}>📚 Mais artigos</div>
                <div className="blog-grid">
                  {demaisArtigos.map((artigo, i) => (
                    <BlogCard
                      key={artigo.id}
                      artigo={artigo}
                      onClick={setArtigoSelecionado}
                      delay={i * 60}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── INSTRUÇÕES STRAPI ─── */}
        {!usandoStrapi && (
          <div id="strapi-setup" style={{
            marginTop: 60, background: 'white', borderRadius: 20,
            border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 2px 8px rgba(26,58,143,0.06)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>
              🚀 Como configurar o Strapi
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                { n: '1', titulo: 'Instalar Strapi', desc: 'npx create-strapi-app@latest meu-blog --quickstart' },
                { n: '2', titulo: 'Criar Collection', desc: 'No painel, crie uma Collection Type chamada "artigo" com os campos: titulo, descricao, conteudo, categoria, autor, emoji, destaque, tempo_leitura' },
                { n: '3', titulo: 'Liberar API',     desc: 'Settings → Roles → Public → artigo → habilite find e findOne' },
                { n: '4', titulo: 'Configurar URL',  desc: 'Crie .env na raiz do React com: REACT_APP_STRAPI_URL=http://localhost:1337' },
              ].map(step => (
                <div key={step.n} style={{
                  background: '#f8fafc', borderRadius: 12, padding: '20px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1a3a8f, #2d52c4)',
                    color: 'white', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', marginBottom: 10
                  }}>{step.n}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 6 }}>{step.titulo}</div>
                  <code style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, display: 'block' }}>{step.desc}</code>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* ─── MODAL ─── */}
      {artigoSelecionado && (
        <div className="blog-modal-overlay" onClick={() => setArtigoSelecionado(null)}>
          <div className="blog-modal-box" onClick={e => e.stopPropagation()}>
            <div className="blog-modal-hero">{artigoSelecionado.emoji}</div>
            <div className="blog-modal-body">
              <span className={`blog-modal-category cat-badge-${artigoSelecionado.categoria}`}>
                {CATEGORIAS.find(c => c.key === artigoSelecionado.categoria)?.label || artigoSelecionado.categoria}
              </span>
              <div className="blog-modal-title">{artigoSelecionado.titulo}</div>
              <div className="blog-modal-meta">
                <div className="blog-modal-avatar">{artigoSelecionado.autor[0]}</div>
                <div>
                  <div className="blog-modal-author">{artigoSelecionado.autor}</div>
                  <div className="blog-modal-date">
                    {new Date(artigoSelecionado.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {' · '}{artigoSelecionado.tempo_leitura} de leitura
                  </div>
                </div>
              </div>
              <div className="blog-modal-content">{artigoSelecionado.conteudo}</div>
              <button className="blog-modal-close-btn" onClick={() => setArtigoSelecionado(null)}>
                Fechar artigo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


export { Blog };
