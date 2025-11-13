// src/routes/libros.routes.js
const router = require('express').Router();
const { pool } = require('../config/database');
const { obtenerRecomendaciones } = require('../controllers/libros.controller');
const { hybridAuth } = require('../middleware/hybrid-auth');

// --- Endpoints de test (bien ubicados bajo /api/libros) ---
router.get('/test-db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, timestamp: rows[0].now });
  } catch (e) {
    res.status(500).json({ error: 'Error de conexión', details: e.message });
  }
});

router.get('/test-table', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) as total, string_agg(column_name, ', ') as columns
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'libros'
    `);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error verificando tabla', details: e.message });
  }
});

// --- Rutas específicas PRIMERO ---
router.get('/recomendaciones', hybridAuth, obtenerRecomendaciones);

// --- Listado ---
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, titulo, autor, isbn, imagen_url, descripcion, categoria, disponibilidad
      FROM public.libros
      ORDER BY id DESC
    `);
    const data = rows.map(r => ({
      id: r.id,
      titulo: r.titulo,
      autor: r.autor,
      isbn: r.isbn,
      imagenUrl: r.imagen_url,
      descripcion: r.descripcion,
      categoria: r.categoria,
      disponibilidad: r.disponibilidad,
      disponible: r.disponibilidad,
    }));
    res.json({ data, paginacion: { total: data.length, limit: 50, offset: 0 } });
  } catch (e) {
    res.status(500).json({ error: 'INTERNAL', detail: e.message });
  }
});

// --- Detalle por ID (sin regex en el path) ---
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { rows } = await pool.query(`
      SELECT l.id, l.titulo, l.autor, l.isbn,
             l.imagen_url, l.descripcion, l.categoria, l.disponibilidad
      FROM public.libros l
      WHERE l.id = $1
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Error obteniendo libro:', e);
    res.status(500).json({ error: 'Error obteniendo libro' });
  }
});

module.exports = router;
