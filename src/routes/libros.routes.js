// src/routes/libros.routes.js
const router = require('express').Router();
const { pool } = require('../config/database');

// Endpoint de prueba para verificar la conexión
router.get('/libros/test-db', async (req, res) => {
  try {
    console.log('🧪 [TEST-DB] Probando conexión...');
    const { rows } = await pool.query('SELECT NOW() as now');
    console.log('✅ [TEST-DB] Conexión exitosa:', rows[0].now);
    res.json({ ok: true, timestamp: rows[0].now });
  } catch (e) {
    console.error('❌ [TEST-DB] Error:', e);
    res.status(500).json({ error: 'Error de conexión', details: e.message });
  }
});

// Endpoint de prueba para verificar la tabla libros
router.get('/libros/test-table', async (req, res) => {
  try {
    console.log('🧪 [TEST-TABLE] Verificando tabla libros...');
    const { rows } = await pool.query(`
      SELECT COUNT(*) as total, 
             string_agg(column_name, ', ') as columns
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'libros'
    `);
    console.log('✅ [TEST-TABLE] Resultado:', rows[0]);
    res.json(rows[0]);
  } catch (e) {
    console.error('❌ [TEST-TABLE] Error:', e);
    res.status(500).json({ error: 'Error verificando tabla', details: e.message });
  }
});

// ⚠️ Si tienes un middleware de auth que podría fallar, monta ESTE router ANTES
// para aislar /api/libros y probarlo sin auth, o comenta temporalmente auth en app.js.

// GET /libros - Listar todos los libros
router.get('/', async (req, res) => {
  try {
    console.log('📚 [GET /libros] Iniciando request...');
    console.log('📚 [GET /libros] Query params:', req.query);
    
    // Si más adelante activas filtro: ?biblioteca_id=#
    const bibliotecaId = req.query.biblioteca_id ? Number(req.query.biblioteca_id) : null;

    let rows;
    if (bibliotecaId) {
      ({ rows } = await pool.query(
        `
        SELECT
          l.id,
          l.titulo,
          l.autor,
          l.isbn,
          l.imagen_url,
          l.descripcion,
          l.categoria,
          l.disponibilidad
        FROM public.biblioteca_libros bl
        JOIN public.libros l ON l.id = bl.libro_id
        WHERE bl.biblioteca_id = $1
        ORDER BY l.id DESC
        `,
        [bibliotecaId]
      ));
    } else {
      ({ rows } = await pool.query(`
        SELECT
          id,
          titulo,
          autor,
          isbn,
          imagen_url,
          descripcion,
          categoria,
          disponibilidad
        FROM public.libros
        ORDER BY id DESC
      `));
    }

    // Map a camelCase si tu front lo espera (no rompe si no)
    const data = rows.map(r => ({
      id: r.id,
      titulo: r.titulo,
      autor: r.autor,
      isbn: r.isbn,
      imagenUrl: r.imagen_url,
      descripcion: r.descripcion,
      categoria: r.categoria,
      disponibilidad: r.disponibilidad,
      // alias opcional
      disponible: r.disponibilidad,
    }));

    console.log('✅ [GET /libros] Datos obtenidos:', { count: data.length });
    return res.json({
      data: Array.isArray(data) ? data : [],
      paginacion: {
        total: data.length,
        limit: 50,
        offset: 0
      }
    });
  } catch (e) {
    console.error('❌ [GET /libros] Error:', e);
    console.error('❌ [GET /libros] Error code:', e.code);
    console.error('❌ [GET /libros] Error message:', e.message);
    console.error('❌ [GET /libros] Error stack:', e.stack);
    
    // Devuelve detalle útil al front para depurar
    if (e.code === '42703') { // undefined_column
      return res.status(500).json({ error: 'DB_COLUMN_MISSING', detail: e.message });
    }
    if (e.code === '42P01') { // undefined_table
      return res.status(500).json({ error: 'DB_RELATION_MISSING', detail: e.message });
    }
    return res.status(500).json({ error: 'INTERNAL', detail: e.message });
  }
});

// GET /libros/:id - Obtener libro por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📚 [GET /libros/:id] Buscando libro:', id);

    const { rows } = await pool.query(`
      SELECT l.id, l.titulo, l.autor, l.isbn, 
             l.imagen_url, l.descripcion, l.categoria, 
             l.disponibilidad
      FROM public.libros l
      WHERE l.id = $1
    `, [id]);

    if (rows.length === 0) {
      console.log('❌ [GET /libros/:id] Libro no encontrado:', id);
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    console.log('✅ [GET /libros/:id] Libro encontrado:', rows[0].titulo);
    res.json(rows[0]);
  } catch (e) {
    console.error('❌ [GET /libros/:id] Error:', e);
    res.status(500).json({ error: 'Error obteniendo libro' });
  }
});

module.exports = router;
