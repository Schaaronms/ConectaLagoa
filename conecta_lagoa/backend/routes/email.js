// routes/email.js
// ================================================
// Rota POST /api/contato — formulário do site
// ================================================

const express = require('express');
const router  = express.Router();
const { enviarEmailContato, enviarConfirmacaoContato } = require('../services/emailService');

router.post('/', async (req, res) => {
  const { nome, email, assunto, mensagem } = req.body;

  if (!nome || !email || !assunto || !mensagem) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Envia para a equipe + confirmação para o usuário em paralelo
    await Promise.all([
      enviarEmailContato({ nome, email, assunto, mensagem }),
      enviarConfirmacaoContato({ para: email, nome, assunto }),
    ]);

    res.json({ sucesso: true, mensagem: 'E-mail enviado com sucesso!' });

  } catch (err) {
    console.error('Erro ao enviar e-mail de contato:', err);
    res.status(500).json({ erro: 'Erro ao enviar e-mail. Tente novamente.' });
  }
});

module.exports = router;