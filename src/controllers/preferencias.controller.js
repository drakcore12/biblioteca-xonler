const pool = require('../config/database');

// GET /api/usuarios/me/preferencias
async function getPreferenciasMe(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const r = await pool.query('SELECT preferencias FROM usuarios WHERE id = $1', [userId]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(r.rows[0].preferencias || {});
  } catch (e) {
    console.error('getPreferenciasMe error:', e);
    res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/usuarios/me/preferencias
async function putPreferenciasMe(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const preferencias = req.body || {};
    const r = await pool.query(
      'UPDATE usuarios SET preferencias = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING preferencias',
      [preferencias, userId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(r.rows[0].preferencias);
  } catch (e) {
    console.error('putPreferenciasMe error:', e);
    res.status(500).json({ error: 'Error interno' });
  }
}

// GET /api/usuarios/:id/preferencias (opcional, útil para admin)
async function getPreferenciasById(req, res) {
  try {
    const { id } = req.params;
    const r = await pool.query('SELECT preferencias FROM usuarios WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(r.rows[0].preferencias || {});
  } catch (e) {
    console.error('getPreferenciasById error:', e);
    res.status(500).json({ error: 'Error interno' });
  }
}

// PUT /api/usuarios/:id/preferencias (fallback que tu front ya intenta)
async function putPreferenciasById(req, res) {
  try {
    const { id } = req.params;
    const preferencias = req.body || {};
    const r = await pool.query(
      'UPDATE usuarios SET preferencias = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING preferencias',
      [preferencias, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(r.rows[0].preferencias);
  } catch (e) {
    console.error('putPreferenciasById error:', e);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = {
  getPreferenciasMe,
  putPreferenciasMe,
  getPreferenciasById,
  putPreferenciasById,
};
