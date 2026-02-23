const { Resend } = require('resend');

// Inicializa com a chave que você colocou no Render
const resend = new Resend(process.env.RESEND_API_KEY);

const enviarEmail = async ({ para, assunto, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'Conecta Lagoa <contato@conectalagoa.com.br>', // Use o e-mail que você validou
      to: para,
      subject: assunto,
      html: html,
    });

    if (data.error) {
      console.error("Erro retornado pelo Resend:", data.error);
      throw new Error(data.error.message);
    }

    console.log("E-mail enviado com sucesso! ID:", data.data.id);
  } catch (error) {
    console.error("Falha ao enviar e-mail via API:", error);
    throw error;
  }
};

module.exports = { enviarEmail };