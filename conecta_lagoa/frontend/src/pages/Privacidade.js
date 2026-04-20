import React from 'react';
import { Link } from 'react-router-dom';

const S = {
  page: {
    minHeight: '100vh',
    background: '#f4f6fb',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  topbar: {
    background: '#fff',
    borderBottom: '1px solid #e4e8f0',
    padding: '0 32px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoBadge: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #1A56DB, #2d52c4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 13,
  },
  logoName: { fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' },
  backBtn: {
    fontSize: 13, color: '#6b7280', textDecoration: 'none',
    padding: '6px 14px', borderRadius: 8, border: '1px solid #e4e8f0',
    background: '#fff', fontWeight: 500,
  },
  hero: {
    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    padding: '60px 32px 52px',
    textAlign: 'center',
  },
  heroLabel: {
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#6ee7b7', background: 'rgba(110,231,183,0.12)',
    padding: '4px 14px', borderRadius: 20, marginBottom: 16,
  },
  heroTitle: { fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: '0 0 12px' },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 },
  heroDate: { marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  body: { maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' },
  toc: {
    background: '#fff', border: '1px solid #e4e8f0',
    borderRadius: 16, padding: '20px 24px', marginBottom: 40,
  },
  tocTitle: {
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 12,
  },
  tocLink: { display: 'block', fontSize: 14, color: '#10b981', textDecoration: 'none', padding: '4px 0', fontWeight: 500 },
  section: { marginBottom: 40 },
  sectionNum: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    color: '#10b981', textTransform: 'uppercase', marginBottom: 6,
  },
  sectionTitle: { fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 14, letterSpacing: '-0.3px' },
  p: { fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: 14 },
  ul: { paddingLeft: 0, listStyle: 'none', marginBottom: 14 },
  li: { fontSize: 15, color: '#374151', lineHeight: 1.7, padding: '5px 0 5px 22px', position: 'relative' },
  liDot: { position: 'absolute', left: 0, top: 10, width: 6, height: 6, borderRadius: '50%', background: '#10b981' },
  divider: { border: 'none', borderTop: '1px solid #e4e8f0', margin: '40px 0' },
  highlight: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 12, padding: '16px 20px', marginBottom: 16,
    fontSize: 14, color: '#064e3b', lineHeight: 1.7,
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    fontSize: 14, marginBottom: 16,
  },
  th: {
    background: '#f4f6fb', padding: '10px 14px',
    textAlign: 'left', fontWeight: 700, color: '#374151',
    border: '1px solid #e4e8f0', fontSize: 13,
  },
  td: {
    padding: '10px 14px', border: '1px solid #e4e8f0',
    color: '#374151', lineHeight: 1.6, verticalAlign: 'top',
  },
  footer: {
    background: '#fff', borderTop: '1px solid #e4e8f0',
    padding: '28px 32px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 12,
  },
  footerText: { fontSize: 13, color: '#9ca3af' },
  footerLinks: { display: 'flex', gap: 20 },
  footerLink: { fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 500 },
};

const SECTIONS = [
  { id: 'responsavel',   num: '01', title: 'Responsável pelo Tratamento' },
  { id: 'dados',         num: '02', title: 'Dados que Coletamos' },
  { id: 'finalidade',    num: '03', title: 'Como Usamos seus Dados' },
  { id: 'compartilhamento', num: '04', title: 'Compartilhamento de Dados' },
  { id: 'cookies',       num: '05', title: 'Cookies e Tecnologias Similares' },
  { id: 'seguranca',     num: '06', title: 'Segurança dos Dados' },
  { id: 'retencao',      num: '07', title: 'Retenção de Dados' },
  { id: 'direitos',      num: '08', title: 'Seus Direitos (LGPD)' },
  { id: 'menores',       num: '09', title: 'Menores de Idade' },
  { id: 'contato',       num: '10', title: 'Contato e DPO' },
];

function Li({ children }) {
  return (
    <li style={S.li}>
      <span style={S.liDot} />
      {children}
    </li>
  );
}

export default function Privacidade() {
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Topbar */}
      <div style={S.topbar}>
        <Link to="/" style={S.logoRow}>
          <div style={S.logoBadge}>CL</div>
          <span style={S.logoName}>Conecta Lagoa</span>
        </Link>
        <Link to="/registro" style={S.backBtn}>← Voltar ao cadastro</Link>
      </div>

      {/* Hero */}
      <div style={S.hero}>
        <span style={S.heroLabel}>Documento Legal</span>
        <h1 style={S.heroTitle}>Política de Privacidade</h1>
        <p style={S.heroSub}>
          Explicamos de forma clara como coletamos, usamos e protegemos
          suas informações pessoais, em conformidade com a LGPD.
        </p>
        <p style={S.heroDate}>Última atualização: Abril de 2026 · Versão 2.0</p>
      </div>

      {/* Body */}
      <div style={S.body}>

        {/* Índice */}
        <div style={S.toc}>
          <div style={S.tocTitle}>Índice</div>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} style={S.tocLink}>
              {s.num}. {s.title}
            </a>
          ))}
        </div>

        <div style={S.highlight}>
          <strong>Em resumo:</strong> Coletamos apenas os dados necessários para prestar nossos serviços.
          Não vendemos seus dados. Você tem controle total sobre suas informações e pode solicitar
          alteração, exportação ou exclusão a qualquer momento.
        </div>

        <hr style={S.divider} />

        {/* 01 */}
        <div style={S.section} id="responsavel">
          <div style={S.sectionNum}>01</div>
          <h2 style={S.sectionTitle}>Responsável pelo Tratamento</h2>
          <p style={S.p}>
            O controlador dos dados pessoais coletados pela Plataforma é:
          </p>
          <div style={S.highlight}>
            <strong>Conecta Lagoa LTDA</strong><br />
            CNPJ: 00.000.000/0001-00<br />
            Endereço: Lagoa Vermelha — RS, Brasil<br />
            E-mail: <a href="mailto:privacidade@conectalagoa.com.br" style={{ color: '#10b981', fontWeight: 600 }}>privacidade@conectalagoa.com.br</a>
          </div>
        </div>

        <hr style={S.divider} />

        {/* 02 */}
        <div style={S.section} id="dados">
          <div style={S.sectionNum}>02</div>
          <h2 style={S.sectionTitle}>Dados que Coletamos</h2>

          <p style={S.p}><strong>Dados fornecidos por você:</strong></p>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Categoria</th>
                <th style={S.th}>Exemplos</th>
                <th style={S.th}>Obrigatoriedade</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Identificação', 'Nome, e-mail, telefone', 'Obrigatório'],
                ['Localização', 'Cidade, estado', 'Opcional'],
                ['Profissional', 'Currículo, habilidades, experiências', 'Opcional'],
                ['Empresarial', 'CNPJ, razão social, descrição da empresa', 'Obrigatório (empresas)'],
                ['Financeiro', 'Dados de pagamento (processados por gateway)', 'Plano Premium'],
                ['Conteúdo', 'Fotos, logo da empresa, descrições de vagas', 'Opcional'],
              ].map(([cat, ex, obs]) => (
                <tr key={cat}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{cat}</td>
                  <td style={S.td}>{ex}</td>
                  <td style={S.td}>{obs}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={S.p}><strong>Dados coletados automaticamente:</strong></p>
          <ul style={S.ul}>
            <Li>Endereço IP e dados de navegação (para segurança e diagnóstico)</Li>
            <Li>Tipo de dispositivo, sistema operacional e navegador</Li>
            <Li>Páginas visitadas, cliques e tempo de sessão</Li>
            <Li>Cookies de sessão e preferências (ver seção 05)</Li>
          </ul>
        </div>

        <hr style={S.divider} />

        {/* 03 */}
        <div style={S.section} id="finalidade">
          <div style={S.sectionNum}>03</div>
          <h2 style={S.sectionTitle}>Como Usamos seus Dados</h2>
          <p style={S.p}>Utilizamos seus dados exclusivamente para as seguintes finalidades:</p>
          <ul style={S.ul}>
            <Li><strong>Prestação do serviço:</strong> criar conta, exibir vagas, processar candidaturas e enviar notificações relacionadas</Li>
            <Li><strong>Matching de IA:</strong> analisar compatibilidade entre candidatos e vagas com base em habilidades e experiências</Li>
            <Li><strong>Comunicação:</strong> enviar confirmações, alertas de vagas, atualizações de candidatura e newsletters (com opt-out disponível)</Li>
            <Li><strong>Segurança:</strong> detectar atividades fraudulentas, proteger contas e cumprir obrigações legais</Li>
            <Li><strong>Melhoria do produto:</strong> analisar uso agregado e anonimizado para aprimorar funcionalidades</Li>
            <Li><strong>Cobrança:</strong> processar pagamentos de planos Premium através de gateway certificado</Li>
          </ul>
          <p style={S.p}>
            Nunca utilizamos seus dados para fins de publicidade de terceiros ou venda a outras empresas.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 04 */}
        <div style={S.section} id="compartilhamento">
          <div style={S.sectionNum}>04</div>
          <h2 style={S.sectionTitle}>Compartilhamento de Dados</h2>
          <p style={S.p}>
            Seus dados pessoais podem ser compartilhados apenas nas seguintes situações:
          </p>
          <ul style={S.ul}>
            <Li><strong>Empresas recrutadoras:</strong> quando você se candidata a uma vaga, seus dados de perfil são visíveis à empresa responsável pela vaga</Li>
            <Li><strong>Prestadores de serviço:</strong> parceiros técnicos (hospedagem, e-mail transacional, gateway de pagamento) que processam dados em nosso nome, com contratos de proteção de dados</Li>
            <Li><strong>Autoridades legais:</strong> quando exigido por lei, ordem judicial ou regulamentação aplicável</Li>
            <Li><strong>Transferência societária:</strong> em caso de fusão, aquisição ou venda de ativos, com notificação prévia aos usuários</Li>
          </ul>
          <p style={S.p}>
            Em nenhuma hipótese vendemos, alugamos ou cedemos dados pessoais a terceiros para fins comerciais.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 05 */}
        <div style={S.section} id="cookies">
          <div style={S.sectionNum}>05</div>
          <h2 style={S.sectionTitle}>Cookies e Tecnologias Similares</h2>
          <p style={S.p}>
            Utilizamos cookies para garantir o funcionamento da Plataforma e melhorar sua experiência:
          </p>
          <ul style={S.ul}>
            <Li><strong>Essenciais:</strong> necessários para autenticação e segurança da sessão (não podem ser desativados)</Li>
            <Li><strong>Funcionais:</strong> armazenam suas preferências como idioma e configurações visuais</Li>
            <Li><strong>Analíticos:</strong> coletam dados agregados e anonimizados de uso para melhorar o produto</Li>
          </ul>
          <p style={S.p}>
            Você pode gerenciar ou bloquear cookies não essenciais através das configurações do
            seu navegador, mas isso pode afetar algumas funcionalidades da Plataforma.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 06 */}
        <div style={S.section} id="seguranca">
          <div style={S.sectionNum}>06</div>
          <h2 style={S.sectionTitle}>Segurança dos Dados</h2>
          <p style={S.p}>
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
          </p>
          <ul style={S.ul}>
            <Li>Criptografia de dados em trânsito via TLS/HTTPS</Li>
            <Li>Armazenamento de senhas com hash bcrypt (nunca em texto puro)</Li>
            <Li>Controle de acesso baseado em funções (RBAC)</Li>
            <Li>Backups regulares com retenção segura</Li>
            <Li>Monitoramento contínuo para detecção de anomalias</Li>
          </ul>
          <p style={S.p}>
            Em caso de incidente de segurança que comprometa seus dados, você será notificado
            dentro do prazo previsto pela LGPD (72 horas para autoridades competentes).
          </p>
        </div>

        <hr style={S.divider} />

        {/* 07 */}
        <div style={S.section} id="retencao">
          <div style={S.sectionNum}>07</div>
          <h2 style={S.sectionTitle}>Retenção de Dados</h2>
          <p style={S.p}>
            Mantemos seus dados pelo tempo necessário para prestar os serviços contratados ou
            cumprir obrigações legais:
          </p>
          <ul style={S.ul}>
            <Li>Dados de conta ativa: mantidos enquanto a conta estiver ativa</Li>
            <Li>Após exclusão da conta: dados anonimizados ou excluídos em até 90 dias</Li>
            <Li>Dados de pagamento: retidos por 5 anos conforme legislação tributária brasileira</Li>
            <Li>Logs de segurança: retidos por 6 meses</Li>
          </ul>
        </div>

        <hr style={S.divider} />

        {/* 08 */}
        <div style={S.section} id="direitos">
          <div style={S.sectionNum}>08</div>
          <h2 style={S.sectionTitle}>Seus Direitos (LGPD)</h2>
          <p style={S.p}>
            Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
          </p>
          <ul style={S.ul}>
            <Li><strong>Confirmação:</strong> saber se tratamos seus dados pessoais</Li>
            <Li><strong>Acesso:</strong> obter cópia dos dados que temos sobre você</Li>
            <Li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</Li>
            <Li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e legível por máquina</Li>
            <Li><strong>Anonimização ou exclusão:</strong> solicitar a anonimização ou exclusão de dados desnecessários</Li>
            <Li><strong>Revogação do consentimento:</strong> retirar seu consentimento a qualquer momento</Li>
            <Li><strong>Oposição:</strong> opor-se ao tratamento de dados em determinadas circunstâncias</Li>
          </ul>
          <p style={S.p}>
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
            <a href="mailto:privacidade@conectalagoa.com.br" style={{ color: '#10b981', fontWeight: 600 }}>
              privacidade@conectalagoa.com.br
            </a>{' '}
            ou acesse as configurações da sua conta. Responderemos em até 15 dias úteis.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 09 */}
        <div style={S.section} id="menores">
          <div style={S.sectionNum}>09</div>
          <h2 style={S.sectionTitle}>Menores de Idade</h2>
          <p style={S.p}>
            O Conecta Lagoa não é direcionado a pessoas com menos de 16 anos. Não coletamos
            intencionalmente dados de menores. Caso identifiquemos que um usuário tem menos de
            16 anos, a conta será removida e os dados excluídos.
          </p>
          <p style={S.p}>
            Para candidatos entre 16 e 18 anos, pode ser necessário o consentimento de um
            responsável legal, conforme as circunstâncias.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 10 */}
        <div style={S.section} id="contato">
          <div style={S.sectionNum}>10</div>
          <h2 style={S.sectionTitle}>Contato e DPO</h2>
          <p style={S.p}>
            Nosso Encarregado de Proteção de Dados (DPO) está disponível para questões
            relacionadas à privacidade e proteção de dados:
          </p>
          <div style={S.highlight}>
            <strong>DPO — Conecta Lagoa</strong><br />
            E-mail: <a href="mailto:privacidade@conectalagoa.com.br" style={{ color: '#10b981', fontWeight: 600 }}>privacidade@conectalagoa.com.br</a><br />
            Resposta em até 15 dias úteis<br /><br />
            Para reclamações não resolvidas, você também pode contatar a{' '}
            <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>{' '}
            em <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>www.gov.br/anpd</a>.
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span style={S.footerText}>© 2026 Conecta Lagoa. Todos os direitos reservados.</span>
        <div style={S.footerLinks}>
          <Link to="/termos" style={S.footerLink}>Termos de Uso</Link>
          <Link to="/registro" style={S.footerLink}>Criar conta</Link>
          <Link to="/" style={S.footerLink}>Início</Link>
        </div>
      </div>
    </div>
  );
}
