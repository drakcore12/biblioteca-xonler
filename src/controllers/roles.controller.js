const { pool } = require('../config/database');

// Obtener todos los roles
async function obtenerRoles(req, res) {
  try {
    const result = await pool.query(`
      SELECT id, name
      FROM roles
      ORDER BY id
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error en obtenerRoles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
}

// Obtener rol por ID
async function obtenerRolPorId(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id, name
      FROM roles
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error en obtenerRolPorId:', error);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
}

module.exports = {
  obtenerRoles,
  obtenerRolPorId
};