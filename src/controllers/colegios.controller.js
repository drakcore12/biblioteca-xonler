const { pool } = require('../config/database');

// GET /colegios - Listar colegios con filtros
async function obtenerColegios(req, res) {
  try {
    const { nombre, direccion, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    // Construir filtros dinámicos
    if (nombre) {
      whereClause += `WHERE nombre ILIKE $${paramIndex}`;
      params.push(`%${nombre}%`);
      paramIndex++;
    }

    if (direccion) {
      whereClause += whereClause ? ' AND ' : 'WHERE ';
      whereClause += `direccion ILIKE $${paramIndex}`;
      params.push(`%${direccion}%`);
      paramIndex++;
    }

    // Agregar paginación
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(`
      SELECT 
        id, nombre, direccion
      FROM colegios
      ${whereClause}
      ORDER BY nombre
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    // Obtener total de registros para paginación
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM colegios
      ${whereClause}
    `, params.slice(0, -2));

    res.json({
      colegios: result.rows,
      paginacion: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error en obtenerColegios:', error);
    res.status(500).json({ error: 'Error al obtener colegios' });
  }
}

// GET /colegios/:id - Obtener colegio por ID
async function obtenerColegioPorId(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, nombre, direccion
      FROM colegios
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en obtenerColegioPorId:', error);
    res.status(500).json({ error: 'Error al obtener el colegio' });
  }
}

// POST /colegios - Crear nuevo colegio (admin)
async function crearColegio(req, res) {
  try {
    const { 
      nombre, direccion
    } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ 
        error: 'Nombre y dirección son obligatorios' 
      });
    }

    const result = await pool.query(`
      INSERT INTO colegios (nombre, direccion)
      VALUES ($1, $2)
      RETURNING id, nombre, direccion
    `, [nombre, direccion]);

    res.status(201).json({
      message: 'Colegio creado exitosamente',
      colegio: result.rows[0]
    });

  } catch (error) {
    console.error('Error en crearColegio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /colegios/:id - Actualizar colegio (admin)
async function actualizarColegio(req, res) {
  try {
    const { id } = req.params;
    const { 
      nombre, direccion
    } = req.body;

    if (!nombre || !direccion) {
      return res.status(400).json({ 
        error: 'Nombre y dirección son obligatorios' 
      });
    }

    // Verificar si el colegio existe
    const existingColegio = await pool.query(
      'SELECT id FROM colegios WHERE id = $1',
      [id]
    );

    if (existingColegio.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }

    const result = await pool.query(`
      UPDATE colegios 
      SET nombre = $1, direccion = $2
      WHERE id = $3
      RETURNING id, nombre, direccion
    `, [nombre, direccion, id]);

    res.json({
      message: 'Colegio actualizado exitosamente',
      colegio: result.rows[0]
    });

  } catch (error) {
    console.error('Error en actualizarColegio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /colegios/:id - Eliminar colegio (admin, con protección)
async function eliminarColegio(req, res) {
  try {
    const { id } = req.params;

    // Verificar si el colegio existe
    const existingColegio = await pool.query(
      'SELECT id FROM colegios WHERE id = $1',
      [id]
    );

    if (existingColegio.rows.length === 0) {
      return res.status(404).json({ error: 'Colegio no encontrado' });
    }

    // Verificar si hay bibliotecas vinculadas
    const bibliotecasVinculadas = await pool.query(
      'SELECT COUNT(*) as count FROM bibliotecas WHERE colegio_id = $1',
      [id]
    );

    if (parseInt(bibliotecasVinculadas.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el colegio porque tiene bibliotecas vinculadas' 
      });
    }

    // Eliminar el colegio
    await pool.query('DELETE FROM colegios WHERE id = $1', [id]);

    res.json({ message: 'Colegio eliminado exitosamente' });

  } catch (error) {
    console.error('Error en eliminarColegio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  obtenerColegios,
  obtenerColegioPorId,
  crearColegio,
  actualizarColegio,
  eliminarColegio
};
