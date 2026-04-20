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
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #1A56DB, #2d52c4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 800,
    fontSize: 13,
  },
  logoName: {
    fontSize: 15,
    fontWeight: 800,
    color: '#111827',
    letterSpacing: '-0.3px',
  },
  backBtn: {
    fontSize: 13,
    color: '#6b7280',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #e4e8f0',
    background: '#fff',
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  hero: {
    background: 'linear-gradient(135deg, #0f1629 0%, #1a2b5a 100%)',
    padding: '60px 32px 52px',
    textAlign: 'center',
  },
  heroLabel: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#60a5fa',
    background: 'rgba(96,165,250,0.12)',
    padding: '4px 14px',
    borderRadius: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.5px',
    margin: '0 0 12px',
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    maxWidth: 500,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  heroDate: {
    marginTop: 20,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  body: {
    maxWidth: 780,
    margin: '0 auto',
    padding: '48px 24px 80px',
  },
  toc: {
    background: '#fff',
    border: '1px solid #e4e8f0',
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 40,
  },
  tocTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9ca3af',
    marginBottom: 12,
  },
  tocLink: {
    display: 'block',
    fontSize: 14,
    color: '#1A56DB',
    textDecoration: 'none',
    padding: '4px 0',
    fontWeight: 500,
  },
  section: {
    marginBottom: 40,
  },
  sectionNum: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#1A56DB',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 14,
    letterSpacing: '-0.3px',
  },
  p: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 1.8,
    marginBottom: 14,
  },
  ul: {
    paddingLeft: 0,
    listStyle: 'none',
    marginBottom: 14,
  },
  li: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 1.7,
    padding: '5px 0 5px 22px',
    position: 'relative',
  },
  liDot: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#1A56DB',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e4e8f0',
    margin: '40px 0',
  },
  highlight: {
    background: '#EFF4FF',
    border: '1px solid #c7d7fc',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 1.7,
  },
  footer: {
    background: '#fff',
    borderTop: '1px solid #e4e8f0',
    padding: '28px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  footerLinks: {
    display: 'flex',
    gap: 20,
  },
  footerLink: {
    fontSize: 13,
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

const SECTIONS = [
  { id: 'aceitacao',     num: '01', title: 'Aceitação dos Termos' },
  { id: 'servicos',      num: '02', title: 'Descrição dos Serviços' },
  { id: 'conta',         num: '03', title: 'Cadastro e Conta' },
  { id: 'uso-aceitavel', num: '04', title: 'Uso Aceitável' },
  { id: 'conteudo',      num: '05', title: 'Conteúdo e Propriedade Intelectual' },
  { id: 'pagamentos',    num: '06', title: 'Planos e Pagamentos' },
  { id: 'privacidade',   num: '07', title: 'Privacidade e Dados' },
  { id: 'limitacoes',    num: '08', title: 'Limitações de Responsabilidade' },
  { id: 'rescisao',      num: '09', title: 'Rescisão' },
  { id: 'contato',       num: '10', title: 'Contato' },
];

function Li({ children }) {
  return (
    <li style={S.li}>
      <span style={S.liDot} />
      {children}
    </li>
  );
}

export default function Termos() {
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Topbar */}
      <div style={S.topbar}>
        <Link to="/" style={{ ...S.logoRow, textDecoration: 'none' }}>
          <div style={S.logoBadge}>CL</div>
          <span style={S.logoName}>Conecta Lagoa</span>
        </Link>
        <Link to="/registro" style={S.backBtn}>← Voltar ao cadastro</Link>
      </div>

      {/* Hero */}
      <div style={S.hero}>
        <span style={S.heroLabel}>Documento Legal</span>
        <h1 style={S.heroTitle}>Termos de Uso</h1>
        <p style={S.heroSub}>
          Leia com atenção antes de criar sua conta. Ao utilizar o Conecta Lagoa,
          você concorda com as condições descritas abaixo.
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
          <strong>Resumo simples:</strong> O Conecta Lagoa conecta empresas e candidatos de Lagoa Vermelha e região. Você pode usar a plataforma gratuitamente com recursos básicos ou assinar um plano Premium. Seus dados são protegidos e nunca vendemos informações pessoais a terceiros.
        </div>

        <hr style={S.divider} />

        {/* 01 */}
        <div style={S.section} id="aceitacao">
          <div style={S.sectionNum}>01</div>
          <h2 style={S.sectionTitle}>Aceitação dos Termos</h2>
          <p style={S.p}>
            Ao acessar ou utilizar a plataforma Conecta Lagoa ("Plataforma"), disponível em{' '}
            <strong>conectalagoa.com.br</strong>, você ("Usuário") concorda em ficar vinculado a estes
            Termos de Uso ("Termos"). Se você não concordar com qualquer parte destes Termos, não
            poderá utilizar a Plataforma.
          </p>
          <p style={S.p}>
            Estes Termos constituem um acordo legal entre você e <strong>Conecta Lagoa LTDA</strong>,
            com sede em Lagoa Vermelha — RS, Brasil. A utilização contínua da Plataforma após qualquer
            modificação nos Termos constitui sua aceitação das alterações.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 02 */}
        <div style={S.section} id="servicos">
          <div style={S.sectionNum}>02</div>
          <h2 style={S.sectionTitle}>Descrição dos Serviços</h2>
          <p style={S.p}>
            O Conecta Lagoa é uma plataforma de recrutamento e seleção que conecta empresas
            da região a candidatos em busca de oportunidades. Os serviços incluem:
          </p>
          <ul style={S.ul}>
            <Li>Publicação e gerenciamento de vagas de emprego por empresas</Li>
            <Li>Candidatura a vagas e gestão de currículo por candidatos</Li>
            <Li>Banco de talentos com busca e filtragem avançada</Li>
            <Li>Copiloto de IA para triagem, matching e análise de candidatos</Li>
            <Li>Agenda de entrevistas e funil de recrutamento (CRM)</Li>
            <Li>Indicadores de RH e relatórios de contratação</Li>
          </ul>
          <p style={S.p}>
            Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer parte dos
            serviços a qualquer momento, com ou sem aviso prévio.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 03 */}
        <div style={S.section} id="conta">
          <div style={S.sectionNum}>03</div>
          <h2 style={S.sectionTitle}>Cadastro e Conta</h2>
          <p style={S.p}>
            Para acessar os recursos da Plataforma, você precisa criar uma conta. Ao se cadastrar,
            você declara que:
          </p>
          <ul style={S.ul}>
            <Li>Tem ao menos 16 anos de idade</Li>
            <Li>As informações fornecidas são verdadeiras, precisas e atualizadas</Li>
            <Li>Você é responsável por manter a confidencialidade de suas credenciais de acesso</Li>
            <Li>Notificará imediatamente o Conecta Lagoa sobre qualquer uso não autorizado da sua conta</Li>
            <Li>Uma empresa deve fornecer CNPJ válido e dados empresariais verídicos</Li>
          </ul>
          <p style={S.p}>
            O Conecta Lagoa se reserva o direito de recusar o cadastro, encerrar contas ou remover
            conteúdo a seu critério, especialmente em caso de violação destes Termos.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 04 */}
        <div style={S.section} id="uso-aceitavel">
          <div style={S.sectionNum}>04</div>
          <h2 style={S.sectionTitle}>Uso Aceitável</h2>
          <p style={S.p}>
            Você concorda em não utilizar a Plataforma para:
          </p>
          <ul style={S.ul}>
            <Li>Publicar vagas falsas, fraudulentas ou enganosas</Li>
            <Li>Coletar dados de outros usuários sem consentimento</Li>
            <Li>Enviar spam, mensagens em massa não solicitadas ou comunicações abusivas</Li>
            <Li>Contornar medidas de segurança ou tentar acessar sistemas restritos</Li>
            <Li>Violar direitos autorais, marcas registradas ou outros direitos de propriedade intelectual</Li>
            <Li>Discriminar candidatos por raça, gênero, religião, orientação sexual ou qualquer outra característica protegida por lei</Li>
            <Li>Praticar qualquer atividade ilegal conforme a legislação brasileira</Li>
          </ul>
          <p style={S.p}>
            Violações das regras de uso aceitável podem resultar na suspensão imediata da conta,
            sem direito a reembolso de valores pagos.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 05 */}
        <div style={S.section} id="conteudo">
          <div style={S.sectionNum}>05</div>
          <h2 style={S.sectionTitle}>Conteúdo e Propriedade Intelectual</h2>
          <p style={S.p}>
            Todo o conteúdo da Plataforma — incluindo textos, logotipos, interfaces, código-fonte,
            algoritmos de IA e materiais gráficos — é propriedade exclusiva do Conecta Lagoa e
            protegido pelas leis de propriedade intelectual brasileiras e internacionais.
          </p>
          <p style={S.p}>
            Ao publicar conteúdo na Plataforma (descrições de vagas, currículos, fotos), você concede
            ao Conecta Lagoa uma licença não exclusiva, mundial, gratuita para exibir e distribuir
            esse conteúdo exclusivamente dentro da Plataforma, com o objetivo de prestar os serviços
            contratados.
          </p>
          <p style={S.p}>
            Você continua sendo o proprietário do conteúdo que publica e pode removê-lo a qualquer
            momento através do painel de configurações.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 06 */}
        <div style={S.section} id="pagamentos">
          <div style={S.sectionNum}>06</div>
          <h2 style={S.sectionTitle}>Planos e Pagamentos</h2>
          <p style={S.p}>
            O Conecta Lagoa oferece dois planos para empresas:
          </p>
          <ul style={S.ul}>
            <Li><strong>Plano Free:</strong> Gratuito, com limitações de vagas e candidatos por vaga. Não requer cartão de crédito.</Li>
            <Li><strong>Plano Premium:</strong> Assinatura mensal de R$ 89,00. Inclui vagas e candidatos ilimitados, Copiloto IA e suporte prioritário.</Li>
          </ul>
          <p style={S.p}>
            Pagamentos são processados por meio de gateway de pagamento certificado. O Conecta Lagoa
            não armazena dados de cartão de crédito. Assinaturas são renovadas automaticamente ao
            final de cada ciclo, salvo cancelamento prévio com ao menos 24h de antecedência.
          </p>
          <p style={S.p}>
            Reembolsos podem ser solicitados em até 7 dias corridos após a cobrança, conforme o
            Código de Defesa do Consumidor (CDC), mediante contato com nosso suporte.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 07 */}
        <div style={S.section} id="privacidade">
          <div style={S.sectionNum}>07</div>
          <h2 style={S.sectionTitle}>Privacidade e Dados</h2>
          <p style={S.p}>
            A coleta, uso e proteção de dados pessoais são regidos pela nossa{' '}
            <Link to="/privacidade" style={{ color: '#1A56DB', fontWeight: 600 }}>
              Política de Privacidade
            </Link>
            , em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
          <p style={S.p}>
            Ao utilizar a Plataforma, você consente com a coleta e processamento de seus dados
            conforme descrito na Política de Privacidade. Nunca vendemos dados pessoais a terceiros.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 08 */}
        <div style={S.section} id="limitacoes">
          <div style={S.sectionNum}>08</div>
          <h2 style={S.sectionTitle}>Limitações de Responsabilidade</h2>
          <p style={S.p}>
            O Conecta Lagoa atua como intermediador entre empresas e candidatos. Não somos
            responsáveis por:
          </p>
          <ul style={S.ul}>
            <Li>Decisões de contratação ou rejeição tomadas por empresas</Li>
            <Li>Informações falsas ou enganosas fornecidas por usuários</Li>
            <Li>Perdas indiretas decorrentes do uso ou impossibilidade de uso da Plataforma</Li>
            <Li>Interrupções temporárias por manutenção ou eventos fora de nosso controle</Li>
          </ul>
          <p style={S.p}>
            Nossa responsabilidade total, em qualquer circunstância, não excederá o valor pago
            pelo usuário nos últimos 3 meses de uso da Plataforma.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 09 */}
        <div style={S.section} id="rescisao">
          <div style={S.sectionNum}>09</div>
          <h2 style={S.sectionTitle}>Rescisão</h2>
          <p style={S.p}>
            Você pode encerrar sua conta a qualquer momento através das configurações da conta.
            O Conecta Lagoa pode suspender ou encerrar sua conta com aviso prévio de 30 dias,
            ou imediatamente em caso de violação destes Termos.
          </p>
          <p style={S.p}>
            Após o encerramento, seus dados serão retidos por até 90 dias para fins legais e de
            auditoria, salvo solicitação de exclusão antecipada conforme a LGPD.
          </p>
        </div>

        <hr style={S.divider} />

        {/* 10 */}
        <div style={S.section} id="contato">
          <div style={S.sectionNum}>10</div>
          <h2 style={S.sectionTitle}>Contato</h2>
          <p style={S.p}>
            Dúvidas, solicitações ou reclamações sobre estes Termos podem ser enviadas para:
          </p>
          <div style={{ ...S.highlight, marginTop: 16 }}>
            <strong>Conecta Lagoa LTDA</strong><br />
            Lagoa Vermelha — RS, Brasil<br />
            E-mail: <a href="mailto:contato@conectalagoa.com.br" style={{ color: '#1A56DB', fontWeight: 600 }}>contato@conectalagoa.com.br</a><br />
            Atendimento: Segunda a Sexta, das 9h às 18h
          </div>
          <p style={S.p}>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito
            o Foro da Comarca de Lagoa Vermelha — RS para dirimir quaisquer conflitos decorrentes
            deste instrumento.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span style={S.footerText}>© 2026 Conecta Lagoa. Todos os direitos reservados.</span>
        <div style={S.footerLinks}>
          <Link to="/privacidade" style={S.footerLink}>Política de Privacidade</Link>
          <Link to="/registro" style={S.footerLink}>Criar conta</Link>
          <Link to="/" style={S.footerLink}>Início</Link>
        </div>
      </div>
    </div>
  );
}
