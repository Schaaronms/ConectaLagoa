// ================================================================
// routes/colaboradores.js — Conecta Lagoa
// FIXES:
//  1. GET /export-csv movido para ANTES de /:id (Express capturava como ID)
//  2. export-csv aceita token via query param (window.open não envia headers)
//  3. import-csv movido para ANTES de /:id pelo mesmo motivo
//  4. from-candidatura movido para ANTES de /:id
// ================================================================
const express  = require('express');
const router   = express.Router();
const { Pool } = require('pg');
const multer   = require('multer');
const csv      = require('csv-parse/sync');

const pool   = new Pool({ connectionString: process.env.DATABASE_URL });
const { authMiddleware: auth } = require('../middleware/auth');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const getEmpresaId = (req) => req.user.empresa_id || req.user.id;

// ── Middleware: aceita token via query param (para window.open/download) ──
// Lê ?token=xxx e injeta no header Authorization se não houver
const authWithQueryToken = (req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return auth(req, res, next);
};

// ================================================================
// ⚠️  ROTAS FIXAS PRIMEIRO — antes de /colaboradores/:id
//     Se ficarem depois, Express trata "export-csv" como um ID
// ================================================================

// ── GET /api/colaboradores/export-csv ────────────────────────────
// Aceita ?token= para funcionar com window.open (sem headers)
// Aceita ?status=ativo&departamento=TI para filtrar o export
router.get('/colaboradores/export-csv', authWithQueryToken, async (req, res) => {
  const empresaId = getEmpresaId(req);
  const { status = '', departamento = '' } = req.query;

  const params = [empresaId];
  const where  = ['empresa_id = $1'];
  if (status)       { params.push(status);       where.push(`status = $${params.length}`); }
  if (departamento) { params.push(departamento); where.push(`departamento = $${params.length}`); }

  try {
    const { rows } = await pool.query(`
      SELECT nome, genero, data_nascimento, departamento, cargo,
             data_admissao, data_desligamento, motivo_desligamento,
             salario, email, telefone, status, observacao
      FROM colaboradores
      WHERE ${where.join(' AND ')}
      ORDER BY nome ASC
    `, params);

    const headers = [
      'nome','genero','data_nascimento','departamento','cargo',
      'data_admissao','data_desligamento','motivo_desligamento',
      'salario','email','telefone','status','observacao',
    ];

    // Formata datas para DD/MM/AAAA e salário para número limpo
    const fmt = (key, val) => {
      if (val === null || val === undefined) return '';
      if ((key.includes('data')) && val) {
        const d = new Date(val);
        if (!isNaN(d)) return d.toLocaleDateString('pt-BR');
      }
      if (key === 'salario' && val) return parseFloat(val).toFixed(2).replace('.', ',');
      const s = String(val);
      // Escapa campos com vírgula ou aspas
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => fmt(h, r[h])).join(',')),
    ];

    const filename = `colaboradores_${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvLines.join('\r\n')); // BOM para Excel PT-BR
  } catch (err) {
    console.error('[export-csv]', err);
    res.status(500).json({ error: 'Erro ao exportar' });
  }
});

// ── POST /api/colaboradores/import-csv ───────────────────────────
router.post('/colaboradores/import-csv', auth, upload.single('file'), async (req, res) => {
  const empresaId = getEmpresaId(req);
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

  try {
    const records = csv.parse(req.file.buffer.toString('utf8'), {
      columns: true, skip_empty_lines: true, trim: true,
    });

    if (records.length === 0)  return res.status(400).json({ error: 'CSV vazio' });
    if (records.length > 500)  return res.status(400).json({ error: 'Máximo 500 registros por importação' });

    const client = await pool.connect();
    let inseridos = 0, erros = [];

    for (const [i, row] of records.entries()) {
      if (!row.nome || !row.data_admissao) {
        erros.push(`Linha ${i + 2}: nome e data_admissao são obrigatórios`); continue;
      }
      try {
        await client.query(`
          INSERT INTO colaboradores
            (empresa_id, nome, genero, data_nascimento, departamento, cargo,
             data_admissao, salario, email, telefone, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ativo')
          ON CONFLICT DO NOTHING
        `, [empresaId, row.nome, row.genero || null,
            row.data_nascimento || null, row.departamento || null,
            row.cargo || null, row.data_admissao,
            row.salario ? parseFloat(row.salario.replace(',','.')) : null,
            row.email || null, row.telefone || null]);
        inseridos++;
      } catch { erros.push(`Linha ${i + 2}: erro ao inserir "${row.nome}"`); }
    }

    client.release();
    res.json({ inseridos, erros, total: records.length });
  } catch (err) {
    console.error('[import-csv]', err);
    res.status(500).json({ error: 'Erro ao processar CSV' });
  }
});

// ── POST /api/colaboradores/from-candidatura ─────────────────────
router.post('/colaboradores/from-candidatura', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  const { candidatura_id, departamento, cargo, data_admissao, salario } = req.body;
  if (!candidatura_id) return res.status(400).json({ error: 'candidatura_id obrigatório' });
  try {
    const { rows: cRows } = await pool.query(`
      SELECT u.nome, u.email, u.telefone FROM candidaturas ca
      JOIN usuarios u ON u.id = ca.candidato_id WHERE ca.id = $1
    `, [candidatura_id]);
    if (!cRows[0]) return res.status(404).json({ error: 'Candidatura não encontrada' });
    const c = cRows[0];
    const { rows } = await pool.query(`
      INSERT INTO colaboradores
        (empresa_id, nome, email, telefone, departamento, cargo,
         data_admissao, salario, status, candidatura_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ativo',$9)
      ON CONFLICT (candidatura_id) DO NOTHING RETURNING *
    `, [empresaId, c.nome, c.email, c.telefone,
        departamento || null, cargo || null,
        data_admissao || new Date(), salario || null, candidatura_id]);
    res.status(201).json(rows[0] || { message: 'Já cadastrado' });
  } catch (err) {
    console.error('[from-candidatura]', err);
    res.status(500).json({ error: 'Erro ao criar colaborador' });
  }
});

// ================================================================
// ROTAS COM :id — depois das fixas
// ================================================================

// ── GET /api/colaboradores ────────────────────────────────────────
router.get('/colaboradores', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  const { status='ativo', departamento='', genero='', busca='', page=1, limit=20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [empresaId];
  const where  = ['c.empresa_id = $1'];

  if (status)       { params.push(status);       where.push(`c.status = $${params.length}`); }
  if (departamento) { params.push(departamento); where.push(`c.departamento = $${params.length}`); }
  if (genero)       { params.push(genero);       where.push(`c.genero = $${params.length}`); }
  if (busca) {
    params.push(`%${busca.toLowerCase()}%`);
    where.push(`(LOWER(c.nome) LIKE $${params.length} OR LOWER(c.cargo) LIKE $${params.length})`);
  }

  const whereSQL = where.join(' AND ');
  try {
    const client = await pool.connect();
    const [rows, count] = await Promise.all([
      client.query(`SELECT c.*, EXTRACT(YEAR FROM AGE(c.data_nascimento))::INT AS idade FROM colaboradores c WHERE ${whereSQL} ORDER BY c.nome ASC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, parseInt(limit), offset]),
      client.query(`SELECT COUNT(*) FROM colaboradores c WHERE ${whereSQL}`, params),
    ]);
    client.release();
    res.json({ data:rows.rows, total:parseInt(count.rows[0].count), page:parseInt(page), pages:Math.ceil(parseInt(count.rows[0].count)/parseInt(limit)) });
  } catch (err) {
    console.error('[GET colaboradores]', err);
    res.status(500).json({ error: 'Erro ao buscar colaboradores' });
  }
});

// ── GET /api/colaboradores/:id ────────────────────────────────────
router.get('/colaboradores/:id', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  try {
    const { rows } = await pool.query('SELECT * FROM colaboradores WHERE id=$1 AND empresa_id=$2', [req.params.id, empresaId]);
    if (!rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Erro ao buscar colaborador' }); }
});

// ── POST /api/colaboradores ───────────────────────────────────────
router.post('/colaboradores', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  const { nome, genero, data_nascimento, departamento, cargo, data_admissao, salario, status='ativo', email, telefone, observacao, candidatura_id=null } = req.body;
  if (!nome)          return res.status(400).json({ error: 'Nome é obrigatório' });
  if (!data_admissao) return res.status(400).json({ error: 'Data de admissão é obrigatória' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO colaboradores (empresa_id, nome, genero, data_nascimento, departamento, cargo, data_admissao, salario, status, email, telefone, observacao, candidatura_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [empresaId, nome, genero, data_nascimento||null, departamento, cargo, data_admissao, salario||null, status, email||null, telefone||null, observacao||null, candidatura_id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST colaboradores]', err);
    res.status(500).json({ error: 'Erro ao criar colaborador' });
  }
});

// ── PUT /api/colaboradores/:id ────────────────────────────────────
router.put('/colaboradores/:id', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  const { nome, genero, data_nascimento, departamento, cargo, data_admissao, salario, email, telefone, observacao } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE colaboradores SET nome=$1, genero=$2, data_nascimento=$3, departamento=$4, cargo=$5, data_admissao=$6, salario=$7, email=$8, telefone=$9, observacao=$10, updated_at=NOW()
      WHERE id=$11 AND empresa_id=$12 RETURNING *
    `, [nome, genero, data_nascimento||null, departamento, cargo, data_admissao, salario||null, email||null, telefone||null, observacao||null, req.params.id, empresaId]);
    if (!rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[PUT colaboradores]', err);
    res.status(500).json({ error: 'Erro ao atualizar colaborador' });
  }
});

// ── PATCH /api/colaboradores/:id/desligar ─────────────────────────
router.patch('/colaboradores/:id/desligar', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  const { data_desligamento, motivo_desligamento } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE colaboradores SET status='desligado', data_desligamento=$1, motivo_desligamento=$2, updated_at=NOW()
      WHERE id=$3 AND empresa_id=$4 RETURNING *
    `, [data_desligamento||new Date(), motivo_desligamento||null, req.params.id, empresaId]);
    if (!rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Erro ao desligar colaborador' }); }
});

// ── DELETE /api/colaboradores/:id ────────────────────────────────
router.delete('/colaboradores/:id', auth, async (req, res) => {
  const empresaId = getEmpresaId(req);
  try {
    const { rowCount } = await pool.query('DELETE FROM colaboradores WHERE id=$1 AND empresa_id=$2', [req.params.id, empresaId]);
    if (!rowCount) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Erro ao deletar colaborador' }); }
});

module.exports = router;