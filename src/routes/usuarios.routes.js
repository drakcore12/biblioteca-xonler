const express = require('express');
const router  = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  actualizarUsuarioActual,
  actualizarUsuarioCompleto,
  eliminarUsuario,
  eliminarUsuarioCompleto,
  loginUsuario,
  cambiarPasswordUsuario,
  actualizarPreferenciasUsuario
} = require('../controllers/usuarios.controller');

const { hybridAuth } = require('../middleware/hybrid-auth');

// ✅ ARREGLADO: Rutas públicas
router.post('/registro', crearUsuario);
router.post('/login',    loginUsuario);

// ✅ ARREGLADO: Rutas protegidas (requieren autenticación)
// ⚠️ IMPORTANTE: Rutas específicas ANTES que las generales
router.get('/me',        hybridAuth, obtenerUsuarioActual);           // Usuario actual
router.put('/me',         hybridAuth, actualizarUsuarioActual);       // Actualizar usuario actual
router.put('/me/preferencias', hybridAuth, actualizarPreferenciasUsuario); // Actualizar preferencias usuario actual
router.put('/me/password', hybridAuth, cambiarPasswordUsuario);       // Cambiar contraseña usuario actual

router.get('/',           hybridAuth, obtenerUsuarios);               // Lista de usuarios
router.post('/',          hybridAuth, crearUsuario);                  // Crear usuario (super admin)
router.get('/:id',        hybridAuth, obtenerUsuarioPorId);           // Usuario por ID
router.put('/:id',        hybridAuth, actualizarUsuario);             // Actualizar usuario por ID
router.put('/:id/password', hybridAuth, cambiarPasswordUsuario);      // Cambiar contraseña por ID
router.put('/:id/completo', hybridAuth, actualizarUsuarioCompleto);   // Actualizar usuario completo (super admin)

router.delete('/:id',     hybridAuth, eliminarUsuario);               // Eliminar usuario
router.delete('/:id/completo', hybridAuth, eliminarUsuarioCompleto);  // Eliminar usuario completo (super admin)

// Test simple
router.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint funcionando', timestamp: new Date().toISOString() });
});

// Debug simple para verificar usuario
router.get('/check/:id', hybridAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/database');
    
    console.log(`🔍 [DEBUG] Verificando usuario ID: ${id}`);
    
    // Verificar si el usuario existe
    const usuario = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id = $1', [id]);
    console.log(`👤 [DEBUG] Usuario encontrado:`, usuario.rows.length > 0 ? 'Sí' : 'No');
    
    // Verificar préstamos
    const prestamos = await pool.query('SELECT COUNT(*) as total FROM prestamos WHERE usuario_id = $1', [id]);
    console.log(`📚 [DEBUG] Total préstamos:`, prestamos.rows[0].total);
    
    // Verificar admin_bibliotecas
    const adminBibliotecas = await pool.query('SELECT COUNT(*) as total FROM admin_bibliotecas WHERE usuario_id = $1', [id]);
    console.log(`🏛️ [DEBUG] Admin bibliotecas:`, adminBibliotecas.rows[0].total);
    
    // Verificar usuario_biblioteca
    const usuarioBiblioteca = await pool.query('SELECT COUNT(*) as total FROM usuario_biblioteca WHERE usuario_id = $1', [id]);
    console.log(`🔗 [DEBUG] Usuario biblioteca:`, usuarioBiblioteca.rows[0].total);
    
    res.json({
      usuario_id: id,
      usuario_existe: usuario.rows.length > 0,
      usuario_data: usuario.rows[0] || null,
      prestamos_total: Number.parseInt(prestamos.rows[0].total, 10),
      admin_bibliotecas_total: Number.parseInt(adminBibliotecas.rows[0].total, 10),
      usuario_biblioteca_total: Number.parseInt(usuarioBiblioteca.rows[0].total, 10)
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test de eliminación simple
router.delete('/test-delete/:id', hybridAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { pool } = require('../config/database');
    
    console.log(`🧪 [TEST DELETE] Iniciando eliminación de usuario ID: ${id}`);
    
    // Verificar si el usuario existe
    const usuario = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id = $1', [id]);
    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log(`👤 [TEST DELETE] Usuario encontrado:`, usuario.rows[0]);
    
    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`🔄 [TEST DELETE] Transacción iniciada`);
      
      // Eliminar préstamos primero
      const prestamosEliminados = await client.query('DELETE FROM prestamos WHERE usuario_id = $1', [id]);
      console.log(`🗑️ [TEST DELETE] Préstamos eliminados:`, prestamosEliminados.rowCount);
      
      // Eliminar relaciones usuario-biblioteca
      const usuarioBibliotecaEliminados = await client.query('DELETE FROM usuario_biblioteca WHERE usuario_id = $1', [id]);
      console.log(`🗑️ [TEST DELETE] Usuario-biblioteca eliminados:`, usuarioBibliotecaEliminados.rowCount);
      
      // Eliminar relaciones admin-biblioteca
      const adminBibliotecaEliminados = await client.query('DELETE FROM admin_bibliotecas WHERE usuario_id = $1', [id]);
      console.log(`🗑️ [TEST DELETE] Admin-biblioteca eliminados:`, adminBibliotecaEliminados.rowCount);
      
      // Eliminar usuario
      const usuarioEliminado = await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      console.log(`🗑️ [TEST DELETE] Usuario eliminado:`, usuarioEliminado.rowCount);
      
      await client.query('COMMIT');
      console.log(`✅ [TEST DELETE] Transacción completada`);
      
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        detalles: {
          prestamos_eliminados: prestamosEliminados.rowCount,
          usuario_biblioteca_eliminados: usuarioBibliotecaEliminados.rowCount,
          admin_biblioteca_eliminados: adminBibliotecaEliminados.rowCount,
          usuario_eliminado: usuarioEliminado.rowCount
        }
      });
      
    } catch (transactionError) {
      console.error(`❌ [TEST DELETE] Error en transacción:`, transactionError);
      console.error(`❌ [TEST DELETE] Error code:`, transactionError.code);
      console.error(`❌ [TEST DELETE] Error detail:`, transactionError.detail);
      console.error(`❌ [TEST DELETE] Error constraint:`, transactionError.constraint);
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ [TEST DELETE] Error:', error);
    res.status(500).json({ 
      error: error.message, 
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
  }
});

module.exports = router;