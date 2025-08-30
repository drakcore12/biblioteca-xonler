const router = require('express').Router();
const { 
  obtenerPrestamos,
  obtenerPrestamoPorId,
  crearPrestamo,
  marcarDevolucion,
  renovarPrestamo,
  obtenerPrestamosUsuarioActual
} = require('../controllers/prestamos.controller');

// Middleware para verificar autenticación
const { auth } = require('../middleware/auth');

// Rutas de diagnóstico (sin autenticación)
router.get('/test', (req, res) => {
  res.json({ message: 'Rutas de préstamos funcionando' });
});

router.get('/test-db', async (req, res) => {
  const { pool } = require('../config/database');
  try {
    // Test 1: Verificar conexión
    await pool.query('SELECT NOW()');
    
    // Test 2: Contar libros
    const librosResult = await pool.query('SELECT COUNT(*) FROM libros');
    
    // Test 3: Contar biblioteca_libros
    const blResult = await pool.query('SELECT COUNT(*) FROM biblioteca_libros');
    
    // Test 4: Verificar libros sin biblioteca
    const librosNoAsignadosResult = await pool.query(`
      SELECT l.id, l.titulo 
      FROM libros l 
      LEFT JOIN biblioteca_libros bl ON l.id = bl.libro_id 
      WHERE bl.id IS NULL
    `);

    res.json({
      status: 'OK',
      counts: {
        libros: parseInt(librosResult.rows[0].count),
        biblioteca_libros: parseInt(blResult.rows[0].count)
      },
      libros_no_asignados: librosNoAsignadosResult.rows
    });
  } catch (error) {
    console.error('Error en test-db:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rutas que requieren autenticación
router.use(auth);

// GET /api/prestamos/usuario/actual - Préstamos del usuario actual
router.get('/usuario/actual', obtenerPrestamosUsuarioActual);

// GET /api/prestamos - Listar préstamos (admin)
router.get('/', obtenerPrestamos);

// GET /api/prestamos/:id - Obtener préstamo por ID
router.get('/:id', obtenerPrestamoPorId);

// POST /api/prestamos - Crear préstamo
router.post('/', crearPrestamo);

// POST /api/prestamos/:id/devolucion - Marcar devolución
router.post('/:id/devolucion', marcarDevolucion);

// POST /api/prestamos/:id/renovar - Renovar préstamo
router.post('/:id/renovar', renovarPrestamo);

module.exports = router;