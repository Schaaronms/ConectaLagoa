const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true para porta 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarEmail = async ({ para, assunto, html }) => {
  await transporter.sendMail({
    from: `"Conecta Lagoa" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: assunto,
    html
  });
};

module.exports = { enviarEmail };