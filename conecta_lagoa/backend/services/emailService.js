// services/emailService.js -- Conecta Lagoa
// Servico central de e-mail (Resend em producao, SMTP em dev, log em fallback)

const FROM = 'Conecta Lagoa <contato@conectalagoa.com.br>';

const enviar = async ({ para, assunto, html }) => {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: FROM,
      to: Array.isArray(para) ? para : [para],
      subject: assunto,
      html,
    });
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require('nodemailer');
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return t.sendMail({ from: '"Conecta Lagoa" <' + process.env.SMTP_USER + '>', to: para, subject: assunto, html });
  }

  console.warn('[emailService] Sem provedor configurado. Para:', para, '| Assunto:', assunto);
};

const enviarRecuperacaoSenha = async (email, token, tipo) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = tipo === 'empresa'
    ? base + '/candidato/redefinir-senha?token=' + token
    : base + '/candidato/redefinir-senha?token=' + token;
  return enviar({
    para: email,
    assunto: 'Redefinir senha - Conecta Lagoa',
    html: '<p>Clique no link para redefinir sua senha:</p><a href="' + link + '">' + link + '</a><p>Link valido por 1 hora.</p>',
  });
};

const enviarBoasVindas = async (email, nome) => {
  return enviar({
    para: email,
    assunto: 'Bem-vindo ao Conecta Lagoa\!',
    html: '<h2>Ola, ' + nome + '\!</h2><p>Sua conta foi criada com sucesso. Acesse a plataforma e comece a usar.</p>',
  });
};

module.exports = { enviar, enviarRecuperacaoSenha, enviarBoasVindas, enviarEmail: enviar };
