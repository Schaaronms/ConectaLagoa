// ================================================================
// config/passport.js — Conecta Lagoa
// Estratégia Google OAuth2 com passport-google-oauth20
//
// Instalar dependências:
//   npm install passport passport-google-oauth20
// ================================================================
const passport      = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool }      = require('./db');

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const nome  = profile.displayName;
      const foto  = profile.photos?.[0]?.value;
      const googleId = profile.id;

      if (!email) {
        return done(null, false, { message: 'E-mail não disponível no perfil Google' });
      }

      // 1. Busca por google_id nas duas tabelas
      let userRow = null;
      let tipo    = null;

      const byCandidato = await pool.query(
        'SELECT id, \'candidato\' AS tipo FROM candidatos WHERE google_id = $1 LIMIT 1',
        [googleId]
      );
      if (byCandidato.rows.length) {
        userRow = byCandidato.rows[0];
        tipo    = 'candidato';
      }

      if (!userRow) {
        const byEmpresa = await pool.query(
          'SELECT id, \'empresa\' AS tipo FROM empresas WHERE google_id = $1 LIMIT 1',
          [googleId]
        );
        if (byEmpresa.rows.length) {
          userRow = byEmpresa.rows[0];
          tipo    = 'empresa';
        }
      }

      // 2. Busca por e-mail (usuário já existe mas ainda sem google_id)
      if (!userRow) {
        const byEmailCandidato = await pool.query(
          'SELECT id FROM candidatos WHERE email = $1 LIMIT 1',
          [email]
        );
        if (byEmailCandidato.rows.length) {
          // Vincula o google_id à conta existente
          await pool.query(
            'UPDATE candidatos SET google_id = $1, foto = COALESCE(foto, $2) WHERE id = $3',
            [googleId, foto, byEmailCandidato.rows[0].id]
          );
          userRow = byEmailCandidato.rows[0];
          tipo    = 'candidato';
        }
      }

      // 3. Cria nova conta de candidato (padrão para Google)
      if (!userRow) {
        const novo = await pool.query(
          `INSERT INTO candidatos (nome_completo, email, google_id, foto, senha)
           VALUES ($1, $2, $3, $4, NULL)
           RETURNING id`,
          [nome, email, googleId, foto]
        );
        userRow = novo.rows[0];
        tipo    = 'candidato';
      }

      return done(null, { id: userRow.id, tipo });

    } catch (err) {
      console.error('[Passport Google]', err.message);
      return done(err, null);
    }
  }
));

module.exports = passport;