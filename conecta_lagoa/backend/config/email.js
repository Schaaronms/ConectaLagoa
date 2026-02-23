const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT), // Converte a string do .env para número
  secure: true, 
  auth: { 
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Adicione estas linhas para evitar o erro de timeout no Render
  connectionTimeout: 10000, // 10 segundos para conectar
  greetingTimeout: 10000,   // 10 segundos para o servidor responder "olá"
  socketTimeout: 15000,     // 15 segundos de inatividade permitida
});

const enviarEmail = async ({ para, assunto, html }) => {
  try {
    await transporter.sendMail({
      from: `"Conecta Lagoa" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: assunto,
      html
    });
    console.log("E-mail enviado com sucesso para:", para);
  } catch (error) {
    console.error("Erro detalhado no sendMail:", error);
    throw error; // Repassa o erro para o controlador tratar
  }
};

module.exports = { enviarEmail };