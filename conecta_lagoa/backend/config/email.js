// config/email.js -- Conecta Lagoa
// Suporte a Resend (producao) ou Nodemailer/SMTP (desenvolvimento)
// Nao trava o servidor se as variaveis nao estiverem configuradas.

const enviarEmail = async ({ para, assunto, html }) => {
  // Resend (producao)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'Conecta Lagoa <contato@conectalagoa.com.br>',
        to: para,
        subject: assunto,
        html,
      });
      if (data.error) throw new Error(data.error.message);
      console.log('[email] Enviado via Resend. ID:', data.data && data.data.id);
      return data;
    } catch (err) {
      console.error('[email] Falha via Resend:', err.message);
      throw err;
    }
  }

  // Nodemailer/SMTP (desenvolvimento)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      const info = await transporter.sendMail({
        from: '"Conecta Lagoa" <' + process.env.SMTP_USER + '>',
        to: para,
        subject: assunto,
        html,
      });
      console.log('[email] Enviado via SMTP:', info.messageId);
      return info;
    } catch (err) {
      console.error('[email] Falha via SMTP:', err.message);
      throw err;
    }
  }

  // Sem configuracao -- apenas loga (nao quebra o servidor)
  console.warn('[email] Nenhum provedor configurado (RESEND_API_KEY ou SMTP_*). Simulando envio.');
  console.warn('[email] Para: ' + para + ' | Assunto: ' + assunto);
};

module.exports = { enviarEmail };
