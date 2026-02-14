const { db } = require('../config/database');

// Atualizar perfil da empresa
const atualizarPerfil = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const { nome, cnpj, telefone, endereco, cidade, estado, descricao } = req.body;

    await db.pool.query(
      `UPDATE empresas 
       SET nome = $1, cnpj = $2, telefone = $3, endereco = $4, 
           cidade = $5, estado = $6, descricao = $7
       WHERE id = $8`,
      [nome, cnpj, telefone, endereco, cidade, estado, descricao, empresaId]
    );

    res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro em atualizarPerfil:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
  }
};

// Upload de logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const empresaId = req.user.id;
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await db.pool.query(
      'UPDATE empresas SET logo_url = $1 WHERE id = $2',
      [logoUrl, empresaId]
    );

    res.json({ 
      success: true, 
      message: 'Logo atualizada com sucesso',
      logo_url: logoUrl
    });
  } catch (error) {
    console.error('Erro em uploadLogo:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar logo' });
  }
};

// Registrar visualização de candidato
const visualizarCandidato = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const candidatoId = req.params.candidatoId;

    // Verificar se candidato existe
    const candidato = await db.get('SELECT id FROM candidatos WHERE id = $1', [candidatoId]);

    if (!candidato) {
      return res.status(404).json({ success: false, message: 'Candidato não encontrado' });
    }

    // Registrar visualização
    await db.pool.query(
      'INSERT INTO visualizacoes (empresa_id, candidato_id) VALUES ($1, $2)',
      [empresaId, candidatoId]
    );

    res.json({ success: true, message: 'Visualização registrada' });
  } catch (error) {
    console.error('Erro em visualizarCandidato:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar visualização' });
  }
};

// Adicionar candidato aos favoritos
const adicionarFavorito = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const candidatoId = req.params.candidatoId;
    const { notas } = req.body;

    await db.pool.query(
      `INSERT INTO favoritos (empresa_id, candidato_id, notas) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (empresa_id, candidato_id) 
       DO UPDATE SET notas = $3, data_favoritado = CURRENT_TIMESTAMP`,
      [empresaId, candidatoId, notas || '']
    );

    res.json({ success: true, message: 'Candidato adicionado aos favoritos' });
  } catch (error) {
    console.error('Erro em adicionarFavorito:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar favorito' });
  }
};

// Remover favorito
const removerFavorito = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const candidatoId = req.params.candidatoId;

    await db.pool.query(
      'DELETE FROM favoritos WHERE empresa_id = $1 AND candidato_id = $2',
      [empresaId, candidatoId]
    );

    res.json({ success: true, message: 'Favorito removido' });
  } catch (error) {
    console.error('Erro em removerFavorito:', error);
    res.status(500).json({ success: false, message: 'Erro ao remover favorito' });
  }
};

// Listar favoritos
const listarFavoritos = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const favoritos = await db.all(
      `SELECT c.*, f.notas, f.data_favoritado
       FROM favoritos f
       INNER JOIN candidatos c ON f.candidato_id = c.id
       WHERE f.empresa_id = $1
       ORDER BY f.data_favoritado DESC`,
      [empresaId]
    );

    // Remover senhas
    const favoritosSemSenha = favoritos.map(f => {
      const { senha, ...resto } = f;
      return resto;
    });

    res.json({ success: true, favoritos: favoritosSemSenha });
  } catch (error) {
    console.error('Erro em listarFavoritos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar favoritos' });
  }
};

// Histórico de visualizações
const historicoVisualizacoes = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const visualizacoes = await db.all(
      `SELECT c.*, v.data_visualizacao
       FROM visualizacoes v
       INNER JOIN candidatos c ON v.candidato_id = c.id
       WHERE v.empresa_id = $1
       ORDER BY v.data_visualizacao DESC
       LIMIT 50`,
      [empresaId]
    );

    // Remover senhas
    const visualizacoesSemSenha = visualizacoes.map(v => {
      const { senha, ...resto } = v;
      return resto;
    });

    res.json({ success: true, visualizacoes: visualizacoesSemSenha });
  } catch (error) {
    console.error('Erro em historicoVisualizacoes:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
  }
};

// Estatísticas da empresa
const getEstatisticas = async (req, res) => {
  try {
    const empresaId = req.user.id;

    // Contar visualizações
    const visualizacoes = await db.get(
      'SELECT COUNT(*) as total FROM visualizacoes WHERE empresa_id = $1',
      [empresaId]
    );

    // Contar favoritos
    const favoritos = await db.get(
      'SELECT COUNT(*) as total FROM favoritos WHERE empresa_id = $1',
      [empresaId]
    );

    res.json({
      success: true,
      estatisticas: {
        total_visualizacoes: visualizacoes ? parseInt(visualizacoes.count) : 0,
        total_favoritos: favoritos ? parseInt(favoritos.count) : 0
      }
    });
  } catch (error) {
    console.error('Erro em getEstatisticas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  atualizarPerfil,
  uploadLogo,
  visualizarCandidato,
  adicionarFavorito,
  removerFavorito,
  listarFavoritos,
  historicoVisualizacoes,
  getEstatisticas
};
