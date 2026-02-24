// src/services/emailService.js
// ================================================
// Serviço central de e-mail usando Resend
// Usado por: recuperação de senha + contato
// ================================================

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Conecta Lagoa <contato@conectalagoa.com.br>';

// ================================================
// Função genérica — base de tudo
// ================================================
const enviarEmail = async ({ para, assunto, html }) => {
  const data = await resend.emails.send({
    from:    FROM,
    to:      Array.isArray(para) ? para : [para],
    subject: assunto,
    html,
  });

  if (data.error) {
    console.error('Erro Resend:', data.error);
    throw new Error(data.error.message);
  }

  console.log(`✅ E-mail enviado para ${para} | ID: ${data.data?.id}`);
  return data;
};

// ================================================
// 1. RECUPERAÇÃO DE SENHA
// ================================================
const enviarEmailRecuperacaoSenha = async ({ para, nome, linkRedefinir }) => {
  return enviarEmail({
    para,
    assunto: '🔐 Redefinir sua senha — Conecta Lagoa',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0f1b4d;padding:28px 32px">
          <h2 style="color:#fff;margin:0;font-size:1.2rem">🔐 Redefinir senha</h2>
          <p style="color:#a0aec0;margin:6px 0 0;font-size:0.85rem">Conecta Lagoa</p>
        </div>
        <div style="padding:28px 32px;background:#fff">
          <p style="color:#1e293b;line-height:1.7">Olá, <strong>${nome}</strong>!</p>
          <p style="color:#475569;line-height:1.7">
            Recebemos uma solicitação para redefinir a senha da sua conta.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${linkRedefinir}"
               style="display:inline-block;background:#0f1b4d;color:#fff;padding:14px 32px;
                      border-radius:8px;text-decoration:none;font-size:0.95rem;font-weight:600">
              Redefinir Senha
            </a>
          </div>
          <p style="color:#94a3b8;font-size:0.82rem;line-height:1.6">
            Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição,
            ignore este e-mail — sua senha permanece a mesma.
          </p>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:0.78rem;color:#94a3b8">
          Conecta Lagoa · Lagoa da Vermelha – RS · contato@conectalagoa.com.br
        </div>
      </div>
    `,
  });
};

// ================================================
// 2. CONTATO — e-mail para a equipe
// ================================================
const enviarEmailContato = async ({ nome, email, assunto, mensagem }) => {
  return enviarEmail({
    para:    'contato@conectalagoa.com.br',
    assunto: `[${assunto}] Mensagem de ${nome}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0f1b4d;padding:28px 32px">
          <h2 style="color:#fff;margin:0;font-size:1.2rem">📬 Nova mensagem de contato</h2>
          <p style="color:#a0aec0;margin:6px 0 0;font-size:0.85rem">Conecta Lagoa — Formulário do site</p>
        </div>
        <div style="padding:28px 32px;background:#fff">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem;width:100px">Nome</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e293b">${nome}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:0.85rem">E-mail</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#1e293b">
                <a href="mailto:${email}" style="color:#3b82f6">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-size:0.85rem">Assunto</td>
              <td style="padding:10px 0;font-weight:600;color:#1e293b">${assunto}</td>
            </tr>
          </table>
          <div style="margin-top:24px">
            <p style="color:#64748b;font-size:0.85rem;margin-bottom:8px">Mensagem</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;color:#1e293b;line-height:1.6;font-size:0.92rem">
              ${mensagem.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9">
            <a href="mailto:${email}?subject=Re: [${assunto}]"
               style="display:inline-block;background:#0f1b4d;color:#fff;padding:11px 22px;
                      border-radius:8px;text-decoration:none;font-size:0.88rem;font-weight:600">
              ↩ Responder para ${nome}
            </a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:0.78rem;color:#94a3b8">
          Conecta Lagoa · Lagoa da Vermelha – RS · contato@conectalagoa.com.br
        </div>
      </div>
    `,
  });
};

// ================================================
// 3. CONTATO — confirmação para quem enviou
// ================================================
const enviarConfirmacaoContato = async ({ para, nome, assunto }) => {
  return enviarEmail({
    para,
    assunto: 'Recebemos sua mensagem! ✅',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0f1b4d;padding:28px 32px">
          <h2 style="color:#fff;margin:0;font-size:1.2rem">✅ Mensagem recebida!</h2>
        </div>
        <div style="padding:28px 32px;background:#fff">
          <p style="color:#1e293b;line-height:1.7">Olá, <strong>${nome}</strong>!</p>
          <p style="color:#475569;line-height:1.7">
            Recebemos sua mensagem sobre <strong>"${assunto}"</strong> e retornaremos
            em até <strong>1 dia útil</strong>.
          </p>
          <p style="color:#475569;line-height:1.7">Obrigado por entrar em contato com o Conecta Lagoa! 🤝</p>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:0.78rem;color:#94a3b8">
          Conecta Lagoa · Lagoa da Vermelha – RS
        </div>
      </div>
    `,
  });
};

module.exports = {
  enviarEmail,
  enviarEmailRecuperacaoSenha,
  enviarEmailContato,
  enviarConfirmacaoContato,
};