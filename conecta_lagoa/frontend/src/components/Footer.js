
import { useState } from "react";

// ================================================
// MODAL DE CONTATO
// ================================================
function ModalContato({ onFechar }) {
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);

    // Abre cliente de e-mail com os dados preenchidos
    const dest    = "contato@conectalagoa.com.br";
    const subject = encodeURIComponent(`[${form.assunto}] Mensagem de ${form.nome}`);
    const body    = encodeURIComponent(
      `Nome: ${form.nome}\nE-mail: ${form.email}\n\nMensagem:\n${form.mensagem}`
    );
    window.location.href = `mailto:${dest}?subject=${subject}&body=${body}`;

    await new Promise((r) => setTimeout(r, 800));
    setEnviando(false);
    setSucesso(true);
    setTimeout(() => { setSucesso(false); onFechar(); }, 2000);
  }

  return (
    <div
      style={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div style={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Entre em Contato</h2>
            <p style={styles.modalSub}>Respondemos em até 1 dia útil ✉️</p>
          </div>
          <button style={styles.modalClose} onClick={onFechar} aria-label="Fechar">✕</button>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>
          {sucesso ? (
            <div style={styles.successMsg}>✅ Abrindo seu cliente de e-mail…</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nome *</label>
                  <input
                    style={styles.input}
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>E-mail *</label>
                  <input
                    style={styles.input}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Assunto *</label>
                <select
                  style={styles.input}
                  name="assunto"
                  value={form.assunto}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione um assunto</option>
                  <option>Suporte Técnico</option>
                  <option>Dúvidas sobre Vagas</option>
                  <option>Planos e Preços</option>
                  <option>Parceria</option>
                  <option>Imprensa</option>
                  <option>Outro</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mensagem *</label>
                <textarea
                  style={{ ...styles.input, minHeight: 110, resize: "vertical" }}
                  name="mensagem"
                  value={form.mensagem}
                  onChange={handleChange}
                  placeholder="Como podemos te ajudar?"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                style={{ ...styles.btnSubmit, opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? "Abrindo e-mail…" : "📨 Enviar Mensagem"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================
// FOOTER PRINCIPAL
// ================================================
export default function Footer() {
  const [modalAberto, setModalAberto] = useState(false);

  const colunas = [
    {
      titulo: "Candidatos",
      links: [
        { label: "Criar Perfil",      href: "/candidatos/cadastro" },
        { label: "Buscar Vagas",      href: "/vagas" },
        { label: "Política de Privacidade",     href: "/politica-privacidade" },
        { label: "Dicas de Carreira", href: "/blog/carreira" },
      ],
    },
    {
      titulo: "Empresas",
      links: [
        { label: "Publicar Vaga",       href: "/empresas/publicar-vaga" },
        { label: "Buscar Candidatos",   href: "/empresas/candidatos" },
        { label: "Planos",              href: "/planos" },
        { label: "Cases de Sucesso",    href: "/cases" },
      ],
    },
    {
      titulo: "Institucional",
      links: [
        { label: "Sobre Nós",   href: "/sobre" },
        { label: "Blog",        href: "/blog" },
        { label: "Parceiros",   href: "/parceiros" },
        { label: "Contato",     href: null, onClick: () => setModalAberto(true) },
      ],
    },
  ];

  return (
    <>
      <footer style={styles.footer}>
        <div style={styles.inner}>

          {/* Marca */}
          <div style={styles.brand}>
            <h2 style={styles.brandName}>Conecta Lagoa</h2>
            <p style={styles.brandDesc}>
              A plataforma de recrutamento que conecta talentos locais com as
              melhores oportunidades da nossa região.
            </p>
          </div>

          {/* Colunas de links */}
          {colunas.map((col) => (
            <div key={col.titulo}>
              <h3 style={styles.colTitle}>{col.titulo}</h3>
              <ul style={styles.linkList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.onClick ? (
                      <button style={styles.linkBtn} onClick={link.onClick}>
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href} style={styles.link}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Bottom */}
        <div style={styles.bottom}>
          © 2026 Conecta Lagoa. Todos os direitos reservados. Feito com{" "}
          <span style={{ color: "#e53e3e" }}>❤️</span> em Lagoa da Vermelha – RS.
        </div>
      </footer>

      {/* Modal de contato */}
      {modalAberto && <ModalContato onFechar={() => setModalAberto(false)} />}
    </>
  );
}

// ================================================
// ESTILOS (inline — sem dependência de CSS externo)
// ================================================
const styles = {
  footer: {
    backgroundColor: "#0f1b4d",
    color: "#fff",
    paddingTop: 56,
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
  },
  inner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 32px",
    display: "grid",
    gridTemplateColumns: "260px repeat(3, 1fr)",
    gap: 40,
  },
  brand: { gridColumn: 1 },
  brandName: { fontSize: "1.2rem", fontWeight: 700, marginBottom: 12 },
  brandDesc: { fontSize: "0.87rem", color: "#a0aec0", lineHeight: 1.65 },

  colTitle: { fontSize: "0.88rem", fontWeight: 700, marginBottom: 16, color: "#fff" },
  linkList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },

  link: {
    fontSize: "0.87rem",
    color: "#a0aec0",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#a0aec0",
    fontSize: "0.87rem",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    fontFamily: "inherit",
  },

  divider: {
    maxWidth: 1100,
    margin: "48px auto 0",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  bottom: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "20px 32px",
    textAlign: "center",
    fontSize: "0.82rem",
    color: "#718096",
  },

  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
    overflow: "hidden",
    animation: "slideUp 0.3s ease",
  },
  modalHeader: {
    background: "#0f1b4d",
    padding: "26px 30px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  modalTitle: { color: "#fff", fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  modalSub:   { color: "#a0aec0", fontSize: "0.83rem", marginTop: 4 },
  modalClose: {
    background: "rgba(255,255,255,0.12)",
    border: "none",
    color: "#fff",
    width: 32, height: 32,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalBody: { padding: "26px 30px 30px" },

  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 0 },
  formGroup: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#2d3748" },
  input: {
    padding: "10px 13px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: "0.88rem",
    fontFamily: "inherit",
    color: "#2d3748",
    background: "#f8fafc",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  btnSubmit: {
    width: "100%",
    padding: 13,
    background: "#0f1b4d",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "0.93rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 4,
  },
  successMsg: {
    textAlign: "center",
    padding: "32px 0",
    fontSize: "1rem",
    color: "#2f855a",
    fontWeight: 600,
  },
};


