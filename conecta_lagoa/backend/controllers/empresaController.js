const { db } = require('../config/database');

// ==================== PERFIL ====================

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

// Meu perfil (empresa logada)
const getMeuPerfil = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const result = await db.pool.query(
      `SELECT id, nome, cnpj, telefone, endereco, cidade, estado, descricao, logo_url, created_at
       FROM empresas WHERE id = $1`,
      [empresaId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Empresa não encontrada' });
    }
    res.json({ success: true, empresa: result.rows[0] });
  } catch (error) {
    console.error('Erro em getMeuPerfil:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
  }
};

// Perfil público de uma empresa por ID
const getPerfilPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.pool.query(
      `SELECT id, nome, cnpj, telefone, endereco, cidade, estado, descricao, logo_url, created_at
       FROM empresas WHERE id = $1`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Empresa não encontrada' });
    }
    res.json({ success: true, empresa: result.rows[0] });
  } catch (error) {
    console.error('Erro em getPerfilPorId:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar empresa' });
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

// ==================== VAGAS ====================

// Listar vagas da empresa
const listarVagas = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const result = await db.pool.query(
      `SELECT
         v.*,
         COUNT(c.id)::int                            AS total_candidatos,
         COUNT(CASE WHEN c.stage >= 5 THEN 1 END)::int AS total_contratados,
         CASE
           WHEN COUNT(c.id) > 0
           THEN ROUND(COUNT(CASE WHEN c.stage >= 5 THEN 1 END)::numeric / COUNT(c.id) * 100)
           ELSE 0
         END                                          AS taxa_conversao,
         CASE
           WHEN COUNT(c.id) > 0
           THEN ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(c.updated_at,NOW()) - c.created_at))/86400))
           ELSE NULL
         END                                          AS tempo_medio
       FROM vagas v
       LEFT JOIN candidaturas c ON c.vaga_id = v.id
       WHERE v.empresa_id = $1
       GROUP BY v.id
       ORDER BY v.created_at DESC`,
      [empresaId]
    );

    res.json({ success: true, vagas: result.rows });
  } catch (error) {
    console.error('Erro em listarVagas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar vagas' });
  }
};

// Criar vaga
const criarVaga = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const {
      titulo, descricao, requisitos, salario,
      cidade, estado, tipo_contrato, modalidade,
      area = '', pcd = false, prazo = null,
    } = req.body;

    if (!titulo) {
      return res.status(400).json({ success: false, message: 'Título é obrigatório' });
    }

    // Garante colunas extras antes de inserir (idempotente)
    await db.pool.query("ALTER TABLE vagas ADD COLUMN IF NOT EXISTS area          VARCHAR(100) DEFAULT ''").catch(()=>{});
    await db.pool.query("ALTER TABLE vagas ADD COLUMN IF NOT EXISTS modalidade    VARCHAR(50)  DEFAULT 'Presencial'").catch(()=>{});
    await db.pool.query("ALTER TABLE vagas ADD COLUMN IF NOT EXISTS pcd           BOOLEAN      DEFAULT false").catch(()=>{});
    await db.pool.query("ALTER TABLE vagas ADD COLUMN IF NOT EXISTS prazo         DATE").catch(()=>{});
    await db.pool.query("ALTER TABLE vagas ADD COLUMN IF NOT EXISTS encerrada     BOOLEAN      DEFAULT false").catch(()=>{});
    await db.pool.query("ALTER TABLE vagas ADD COLUMN IF NOT EXISTS estado        VARCHAR(2)").catch(()=>{});

    const result = await db.pool.query(
      `INSERT INTO vagas
         (empresa_id, titulo, descricao, requisitos, salario,
          cidade, estado, tipo_contrato, modalidade, area, pcd, prazo, ativa)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, true)
       RETURNING *`,
      [
        empresaId, titulo, descricao, requisitos, salario,
        cidade, estado, tipo_contrato, modalidade,
        area, pcd, prazo
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Vaga criada com sucesso',
      vaga: result.rows[0]
    });
  } catch (error) {
    console.error('Erro em criarVaga:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar vaga', detail: error.message });
  }
};

// Atualizar vaga
const atualizarVaga = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const { vagaId } = req.params;
    const {
      titulo, descricao, requisitos, salario,
      cidade, estado, tipo_contrato, modalidade,
      area = '', pcd = false, prazo = null, ativa, encerrada,
    } = req.body;

    const check = await db.pool.query(
      'SELECT id FROM vagas WHERE id = $1 AND empresa_id = $2',
      [vagaId, empresaId]
    );

    if (!check.rows.length) {
      return res.status(404).json({ success: false, message: 'Vaga não encontrada ou sem permissão' });
    }

    await db.pool.query(
      `UPDATE vagas
       SET titulo = $1, descricao = $2, requisitos = $3, salario = $4,
           cidade = $5, estado = $6, tipo_contrato = $7, modalidade = $8,
           area = $9, pcd = $10, prazo = $11,
           ativa = COALESCE($12, ativa),
           encerrada = COALESCE($13, encerrada),
           updated_at = NOW()
       WHERE id = $14 AND empresa_id = $15`,
      [
        titulo, descricao, requisitos, salario,
        cidade, estado, tipo_contrato, modalidade,
        area, pcd, prazo,
        ativa !== undefined ? ativa : null,
        encerrada !== undefined ? encerrada : null,
        vagaId, empresaId
      ]
    );

    res.json({ success: true, message: 'Vaga atualizada com sucesso' });
  } catch (error) {
    console.error('Erro em atualizarVaga:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar vaga', detail: error.message });
  }
};

// Excluir vaga
const excluirVaga = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const { vagaId } = req.params;

    const check = await db.pool.query(
      'SELECT id FROM vagas WHERE id = $1 AND empresa_id = $2',
      [vagaId, empresaId]
    );

    if (!check.rows.length) {
      return res.status(404).json({ success: false, message: 'Vaga não encontrada ou sem permissão' });
    }

    await db.pool.query(
      'DELETE FROM vagas WHERE id = $1 AND empresa_id = $2',
      [vagaId, empresaId]
    );

    res.json({ success: true, message: 'Vaga excluída com sucesso' });
  } catch (error) {
    console.error('Erro em excluirVaga:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir vaga' });
  }
};

// ==================== DASHBOARD ====================

// Resumo do dashboard
const getResumoDashboard = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const [vagas, visualizacoes, favoritos] = await Promise.all([
      db.pool.query('SELECT COUNT(*) as total FROM vagas WHERE empresa_id = $1', [empresaId]).then(r => r.rows[0]),
      db.pool.query('SELECT COUNT(*) as total FROM visualizacoes WHERE empresa_id = $1', [empresaId]).then(r => r.rows[0]),
      db.pool.query('SELECT COUNT(*) as total FROM favoritos WHERE empresa_id = $1', [empresaId]).then(r => r.rows[0]),
    ]);

    res.json({
      success: true,
      resumo: {
        total_vagas: parseInt(vagas?.count || 0),
        total_visualizacoes: parseInt(visualizacoes?.count || 0),
        total_favoritos: parseInt(favoritos?.count || 0),
      }
    });
  } catch (error) {
    console.error('Erro em getResumoDashboard:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar resumo do dashboard' });
  }
};

// ==================== INTERAÇÕES COM CANDIDATOS ====================

// Registrar visualização de candidato
const visualizarCandidato = async (req, res) => {
  try {
    const empresaId = req.user.id;
    const candidatoId = req.params.candidatoId;

    const candidato = await db.pool.query('SELECT id FROM candidatos WHERE id = $1', [candidatoId]).then(r => r.rows[0]);

    if (!candidato) {
      return res.status(404).json({ success: false, message: 'Candidato não encontrado' });
    }

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

    const favoritosSemSenha = favoritos.map(({ senha, ...resto }) => resto);

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

    const visualizacoesSemSenha = visualizacoes.map(({ senha, ...resto }) => resto);

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

    const [visualizacoes, favoritos] = await Promise.all([
      db.pool.query('SELECT COUNT(*) as total FROM visualizacoes WHERE empresa_id = $1', [empresaId]).then(r => r.rows[0]),
      db.pool.query('SELECT COUNT(*) as total FROM favoritos WHERE empresa_id = $1', [empresaId]).then(r => r.rows[0]),
    ]);

    res.json({
      success: true,
      estatisticas: {
        total_visualizacoes: parseInt(visualizacoes?.count || 0),
        total_favoritos: parseInt(favoritos?.count || 0),
      }
    });
  } catch (error) {
    console.error('Erro em getEstatisticas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
};

// Candidatos por vaga
const candidatosPorVaga = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const resultado = await db.all(
      `SELECT v.id as vaga_id, v.titulo, COUNT(c.id) as total_candidatos
       FROM vagas v
       LEFT JOIN candidaturas c ON c.vaga_id = v.id
       WHERE v.empresa_id = $1
       GROUP BY v.id, v.titulo
       ORDER BY total_candidatos DESC`,
      [empresaId]
    );

    res.json({ success: true, dados: resultado });
  } catch (error) {
    console.error('Erro em candidatosPorVaga:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos por vaga' });
  }
};

// Candidatos ativos (com candidaturas em aberto)
const candidatosAtivos = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const candidatos = await db.all(
      `SELECT DISTINCT c.id, c.nome, c.email, c.cidade, c.estado
       FROM candidaturas ca
       INNER JOIN candidatos c ON ca.candidato_id = c.id
       INNER JOIN vagas v ON ca.vaga_id = v.id
       WHERE v.empresa_id = $1 AND ca.status = 'ativo'
       ORDER BY c.nome`,
      [empresaId]
    );

    res.json({ success: true, candidatos });
  } catch (error) {
    console.error('Erro em candidatosAtivos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos ativos' });
  }
};

// Candidatos contratados
const candidatosContratados = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const candidatos = await db.all(
      `SELECT DISTINCT c.id, c.nome, c.email, c.cidade, c.estado, ca.updated_at as data_contratacao
       FROM candidaturas ca
       INNER JOIN candidatos c ON ca.candidato_id = c.id
       INNER JOIN vagas v ON ca.vaga_id = v.id
       WHERE v.empresa_id = $1 AND ca.status = 'contratado'
       ORDER BY ca.updated_at DESC`,
      [empresaId]
    );

    res.json({ success: true, candidatos });
  } catch (error) {
    console.error('Erro em candidatosContratados:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos contratados' });
  }
};

// ==================== DASHBOARD AVANÇADO ====================

// Gráfico de candidaturas por mês
const graficoCandidaturas = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const dados = await db.all(
      `SELECT 
         TO_CHAR(ca.created_at, 'YYYY-MM') as mes,
         COUNT(*) as total
       FROM candidaturas ca
       INNER JOIN vagas v ON ca.vaga_id = v.id
       WHERE v.empresa_id = $1
         AND ca.created_at >= NOW() - INTERVAL '6 months'
       GROUP BY mes
       ORDER BY mes ASC`,
      [empresaId]
    );

    res.json({ success: true, dados });
  } catch (error) {
    console.error('Erro em graficoCandidaturas:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar gráfico de candidaturas' });
  }
};

// Vagas agrupadas por área/modalidade
const vagasPorArea = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const dados = await db.all(
      `SELECT 
         modalidade as area,
         COUNT(*) as total
       FROM vagas
       WHERE empresa_id = $1
       GROUP BY modalidade
       ORDER BY total DESC`,
      [empresaId]
    );

    res.json({ success: true, dados });
  } catch (error) {
    console.error('Erro em vagasPorArea:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar vagas por área' });
  }
};

// Vagas criadas por mês
const vagasPorMes = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const dados = await db.all(
      `SELECT 
         TO_CHAR(created_at, 'YYYY-MM') as mes,
         COUNT(*) as total
       FROM vagas
       WHERE empresa_id = $1
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY mes
       ORDER BY mes ASC`,
      [empresaId]
    );

    res.json({ success: true, dados });
  } catch (error) {
    console.error('Erro em vagasPorMes:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar vagas por mês' });
  }
};

// Candidatos que se candidataram recentemente
const candidatosRecentes = async (req, res) => {
  try {
    const empresaId = req.user.id;

    const candidatos = await db.all(
      `SELECT 
         c.id, c.nome_completo, c.email, c.cidade, c.estado, c.foto_url,
         v.titulo as vaga_titulo,
         ca.created_at as data_candidatura
       FROM candidaturas ca
       INNER JOIN candidatos c ON ca.candidato_id = c.id
       INNER JOIN vagas v ON ca.vaga_id = v.id
       WHERE v.empresa_id = $1
       ORDER BY ca.created_at DESC
       LIMIT 10`,
      [empresaId]
    );

    res.json({ success: true, candidatos });
  } catch (error) {
    console.error('Erro em candidatosRecentes:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos recentes' });
  }
};

module.exports = {
  // Perfil
  atualizarPerfil,
  getMeuPerfil,
  getPerfilPorId,
  uploadLogo,
  // Vagas
  listarVagas,
  criarVaga,
  atualizarVaga,
  excluirVaga,
  // Dashboard
  getResumoDashboard,
  // Interações
  visualizarCandidato,
  adicionarFavorito,
  removerFavorito,
  listarFavoritos,
  historicoVisualizacoes,
  getEstatisticas,
  candidatosPorVaga,
  candidatosAtivos,
  candidatosContratados,
  graficoCandidaturas,
  vagasPorArea,
  vagasPorMes,
  candidatosRecentes,
};
