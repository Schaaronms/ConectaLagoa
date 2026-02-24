import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import './Blog.css';
import { fetchArticles } from '../services/strapiApi';  

// ─── CONFIG STRAPI ───────────────────────────────────────────
const STRAPI_URL = process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337';

// ─── DADOS DE EXEMPLO (fallback quando Strapi não está disponível) ───
const ARTIGOS_EXEMPLO = [
  {
    id: 1,
    titulo: "Como montar um currículo que chama atenção em 2025",
    descricao: "Dicas práticas para destacar suas habilidades e conquistar a vaga dos seus sonhos no mercado local.",
    conteudo: `Um bom currículo é sua porta de entrada para qualquer processo seletivo. Neste artigo, vamos explorar as
     principais dicas para criar um documento que realmente impressione os recrutadores.\n\n**1. Seja objetivo e claro**\nRecrutadores gastam em média 6 segundos olhando para um currículo. Por isso, coloque as informações mais importantes primeiro.\n\n**2. Personalize para cada vaga**\nAdapte o currículo para cada empresa. Leia o anúncio com atenção e destaque as experiências que mais se encaixam.\n\n**3. Destaque resultados, não só responsabilidades**\nEm vez de "responsável pelo setor de vendas", escreva "aumentei as vendas em 30% em 6 meses".\n\n**4. Use um formato limpo**\nEvite cores excessivas e fontes muito elaboradas. Clareza é mais importante que design.\n\n**5. Revise antes de enviar**\nErros de português causam péssima impressão. Peça para alguém revisar antes de enviar.`,
    categoria: "carreira",
    autor: "Equipe Conecta",
    data: "2025-01-15",
    emoji: "📄",
    destaque: true,
    tempo_leitura: "5 min",
  },
  // ... (os outros 5 artigos de exemplo permanecem iguais, omiti aqui para encurtar)
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
            <div className="blog-card-avatar">{artigo.autor?.[0] || '?'}</div>
            <div>
              <div className="blog-card-author-name">{artigo.autor || 'Anônimo'}</div>
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

  const fetchArtigos = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        populate: '*',
        sort: 'publishedAt:desc',
        ...(categoria !== 'todas' && { 'filters[categoria][$eq]': categoria }),
        ...(busca && { 'filters[titulo][$containsi]': busca }),
      });

      const res = await fetch(`${STRAPI_URL}/api/artigos?${params.toString()}`, {
        signal: AbortSignal.timeout(5000), // aumentei um pouco o timeout
      });

      if (!res.ok) {
        throw new Error(`Status: ${res.status}`);
      }

      const json = await res.json();

      // Adaptação para Strapi v5 (campos diretos, sem .attributes)
      const adaptados = json.data?.map(item => ({
        id:            item.id,
        documentId:    item.documentId,
        titulo:        item.titulo,
        descricao:     item.descricao,
        conteudo:      item.conteudo,
        categoria:     item.categoria,
        autor:         item.autor,
        data:          item.publishedAt || item.createdAt,
        emoji:         item.emoji || '📝',
        destaque:      item.destaque || false,
        tempo_leitura: item.tempo_leitura || '3 min',
      })) || [];

      setArtigos(adaptados);
      setUsandoStrapi(true);

    } catch (err) {
      console.error('Erro ao buscar do Strapi:', err);

      // Fallback para dados de exemplo
      let filtrados = ARTIGOS_EXEMPLO;
      if (categoria !== 'todas') {
        filtrados = filtrados.filter(a => a.categoria === categoria);
      }
      if (busca) {
        filtrados = filtrados.filter(a =>
          a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          a.descricao.toLowerCase().includes(busca.toLowerCase())
        );
      }
      setArtigos(filtrados);
      setUsandoStrapi(false);
    } finally {
      setLoading(false);
    }
  }, [categoria, busca]);

  useEffect(() => {
    fetchArtigos();
  }, [fetchArtigos]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => setBusca(buscaInput), 500);
    return () => clearTimeout(timer);
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
                      <div className="blog-featured-avatar">{artigoDestaque.autor?.[0] || '?'}</div>
                      <div>
                        <div className="blog-featured-author">{artigoDestaque.autor || 'Anônimo'}</div>
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

            {demaisArtigos.length > 0 && (
              <>
                <div className="blog-section-title" style={{ marginTop: 36 }}>📚 Mais artigos</div>
                <div className="blog-grid">
                  {demaisArtigos.map((artigo, i) => (
                    <BlogCard
                      key={artigo.id || artigo.documentId}
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

        {/* MODAL */}
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
                  <div className="blog-modal-avatar">{artigoSelecionado.autor?.[0] || '?'}</div>
                  <div>
                    <div className="blog-modal-author">{artigoSelecionado.autor || 'Anônimo'}</div>
                    <div className="blog-modal-date">
                      {new Date(artigoSelecionado.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {' · '}{artigoSelecionado.tempo_leitura} de leitura
                    </div>
                  </div>
                </div>

                {/* Renderização correta do rich text do Strapi */}
                <div className="blog-modal-content">
                  {Array.isArray(artigoSelecionado.conteudo) ? (
                    artigoSelecionado.conteudo.map((block, idx) => (
                      <p key={idx}>
                        {block.children?.map((child, i) => child.text || '').join('')}
                      </p>
                    ))
                  ) : (
                    <p>{artigoSelecionado.conteudo || 'Conteúdo não disponível'}</p>
                  )}
                </div>

                <button className="blog-modal-close-btn" onClick={() => setArtigoSelecionado(null)}>
                  Fechar artigo
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export { Blog };