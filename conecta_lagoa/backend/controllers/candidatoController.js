const { db } = require('../config/database');

// Atualizar perfil do candidato
const atualizarPerfil = async (req, res) => {
  try {
    const candidatoId = req.user.id;
    const {
      nome_completo,
      telefone,
      data_nascimento,
      cidade,
      estado,
      endereco,
      sobre_mim,
      linkedin_url,
      portfolio_url
    } = req.body;

    await db.pool.query(
      `UPDATE candidatos 
       SET nome_completo = $1, telefone = $2, data_nascimento = $3, 
           cidade = $4, estado = $5, endereco = $6, sobre_mim = $7,
           linkedin_url = $8, portfolio_url = $9, ultima_atualizacao = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [nome_completo, telefone, data_nascimento, cidade, estado, endereco, sobre_mim, linkedin_url, portfolio_url, candidatoId]
    );

    res.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro em atualizarPerfil:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
  }
};

// Upload de currículo
const uploadCurriculo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const candidatoId = req.user.id;
    const curriculoUrl = `/uploads/curriculos/${req.file.filename}`;

    await db.pool.query(
      'UPDATE candidatos SET curriculo_url = $1, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = $2',
      [curriculoUrl, candidatoId]
    );

    res.json({ 
      success: true, 
      message: 'Currículo enviado com sucesso',
      curriculo_url: curriculoUrl
    });
  } catch (error) {
    console.error('Erro em uploadCurriculo:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar currículo' });
  }
};

// Upload de foto
const uploadFoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
    }

    const candidatoId = req.user.id;
    const fotoUrl = `/uploads/fotos/${req.file.filename}`;

    await db.pool.query(
      'UPDATE candidatos SET foto_url = $1 WHERE id = $2',
      [fotoUrl, candidatoId]
    );

    res.json({ 
      success: true, 
      message: 'Foto atualizada com sucesso',
      foto_url: fotoUrl
    });
  } catch (error) {
    console.error('Erro em uploadFoto:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar foto' });
  }
};

// Adicionar experiência profissional
const adicionarExperiencia = async (req, res) => {
  try {
    const candidatoId = req.user.id;
    const { cargo, empresa, descricao, data_inicio, data_fim, atual } = req.body;

    const result = await db.pool.query(
      `INSERT INTO experiencias (candidato_id, cargo, empresa, descricao, data_inicio, data_fim, atual)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [candidatoId, cargo, empresa, descricao, data_inicio, data_fim, atual || false]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Experiência adicionada',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Erro em adicionarExperiencia:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar experiência' });
  }
};

// Adicionar formação acadêmica
const adicionarFormacao = async (req, res) => {
  try {
    const candidatoId = req.user.id;
    const { instituicao, curso, nivel, data_inicio, data_conclusao, situacao } = req.body;

    const result = await db.pool.query(
      `INSERT INTO formacoes (candidato_id, instituicao, curso, nivel, data_inicio, data_conclusao, situacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [candidatoId, instituicao, curso, nivel, data_inicio, data_conclusao, situacao]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Formação adicionada',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Erro em adicionarFormacao:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar formação' });
  }
};

// Adicionar habilidade
const adicionarHabilidade = async (req, res) => {
  try {
    const candidatoId = req.user.id;
    const { nome, nivel } = req.body;

    const result = await db.pool.query(
      'INSERT INTO habilidades (candidato_id, nome, nivel) VALUES ($1, $2, $3) RETURNING id',
      [candidatoId, nome, nivel]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Habilidade adicionada',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Erro em adicionarHabilidade:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar habilidade' });
  }
};

// Obter perfil completo do candidato
const getPerfilCompleto = async (req, res) => {
  try {
    const candidatoId = req.params.id || req.user.id;

    const candidato = await db.get('SELECT * FROM candidatos WHERE id = $1', [candidatoId]);

    if (!candidato) {
      return res.status(404).json({ success: false, message: 'Candidato não encontrado' });
    }

    // Remover senha
    delete candidato.senha;

    // Buscar experiências
    const experiencias = await db.all(
      'SELECT * FROM experiencias WHERE candidato_id = $1 ORDER BY data_inicio DESC',
      [candidatoId]
    );

    // Buscar formações
    const formacoes = await db.all(
      'SELECT * FROM formacoes WHERE candidato_id = $1 ORDER BY data_inicio DESC',
      [candidatoId]
    );

    // Buscar habilidades
    const habilidades = await db.all(
      'SELECT * FROM habilidades WHERE candidato_id = $1',
      [candidatoId]
    );

    // Buscar idiomas
    const idiomas = await db.all(
      'SELECT * FROM idiomas WHERE candidato_id = $1',
      [candidatoId]
    );

    // Buscar áreas de interesse
    const areas = await db.all(
      'SELECT * FROM areas_interesse WHERE candidato_id = $1',
      [candidatoId]
    );

    res.json({
      success: true,
      candidato: {
        ...candidato,
        experiencias: experiencias || [],
        formacoes: formacoes || [],
        habilidades: habilidades || [],
        idiomas: idiomas || [],
        areas_interesse: areas || []
      }
    });
  } catch (error) {
    console.error('Erro em getPerfilCompleto:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
  }
};

// Buscar candidatos (para empresas)
const buscarCandidatos = async (req, res) => {
  try {
    const { 
      cargo, 
      cidade, 
      estado, 
      habilidade,
      area,
      page = 1, 
      limit = 20 
    } = req.query;

    let sql = 'SELECT * FROM candidatos WHERE ativo = true';
    const params = [];
    let paramCount = 1;

    if (cidade) {
      sql += ` AND cidade ILIKE $${paramCount}`;
      params.push(`%${cidade}%`);
      paramCount++;
    }

    if (estado) {
      sql += ` AND estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    sql += ` ORDER BY data_cadastro DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const candidatos = await db.all(sql, params);

    // Remover senhas
    const candidatosSemSenha = candidatos.map(c => {
      const { senha, ...resto } = c;
      return resto;
    });

    // Contar total
    let countSql = 'SELECT COUNT(*) as total FROM candidatos WHERE ativo = true';
    const countParams = [];
    let countParamCount = 1;
    
    if (cidade) {
      countSql += ` AND cidade ILIKE $${countParamCount}`;
      countParams.push(`%${cidade}%`);
      countParamCount++;
    }
    
    if (estado) {
      countSql += ` AND estado = $${countParamCount}`;
      countParams.push(estado);
    }

    const result = await db.get(countSql, countParams);
    const total = result ? parseInt(result.count) : 0;

    res.json({
      success: true,
      candidatos: candidatosSemSenha,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro em buscarCandidatos:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar candidatos' });
  }
};

module.exports = {
  atualizarPerfil,
  uploadCurriculo,
  uploadFoto,
  adicionarExperiencia,
  adicionarFormacao,
  adicionarHabilidade,
  // Ajuste aqui: a rota espera 'getMeuPerfil' e 'getPerfilPorId'
  getMeuPerfil: getPerfilCompleto, 
  getPerfilPorId: getPerfilCompleto, 
  buscarCandidatos
};