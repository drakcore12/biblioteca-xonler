const { pool } = require('../config/database');

// GET /roles - Listar todos los roles
async function obtenerRoles(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, description, created_at, updated_at
      FROM roles
      ORDER BY id
    `);
    
    console.log('📊 [ROLES] Roles encontrados en la base de datos:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error en obtenerRoles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
}

// GET /roles/:id - Obtener rol por ID
async function obtenerRolPorId(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, name, description, created_at, updated_at
      FROM roles
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en obtenerRolPorId:', error);
    res.status(500).json({ error: 'Error al obtener el rol' });
  }
}

// POST /roles - Crear nuevo rol (admin)
async function crearRol(req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'El nombre del rol es obligatorio' 
      });
    }

    // Verificar si el rol ya existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [name]
    );

    if (existingRole.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe un rol con ese nombre' 
      });
    }

    const result = await pool.query(`
      INSERT INTO roles (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at, updated_at
    `, [name, description]);

    res.status(201).json({
      message: 'Rol creado exitosamente',
      rol: result.rows[0]
    });

  } catch (error) {
    console.error('Error en crearRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /roles/:id - Actualizar rol (admin)
async function actualizarRol(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'El nombre del rol es obligatorio' 
      });
    }

    // Verificar si el rol existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar si el nuevo nombre ya existe en otro rol
    const duplicateName = await pool.query(
      'SELECT id FROM roles WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (duplicateName.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe otro rol con ese nombre' 
      });
    }

    const result = await pool.query(`
      UPDATE roles 
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, description, created_at, updated_at
    `, [name, description, id]);

    res.json({
      message: 'Rol actualizado exitosamente',
      rol: result.rows[0]
    });

  } catch (error) {
    console.error('Error en actualizarRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /roles/:id - Eliminar rol (admin, con protección)
async function eliminarRol(req, res) {
  try {
    const { id } = req.params;

    // Verificar si el rol existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Verificar si hay usuarios usando este rol
    const usuariosConRol = await pool.query(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol_id = $1',
      [id]
    );

    if (parseInt(usuariosConRol.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el rol porque hay usuarios asignados a él' 
      });
    }

    // Eliminar el rol
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);

    res.json({ message: 'Rol eliminado exitosamente' });

  } catch (error) {
    console.error('Error en eliminarRol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol
};
