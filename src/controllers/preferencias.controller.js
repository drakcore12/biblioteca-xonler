const { pool } = require('../config/database');

// Obtener preferencias del usuario actual
async function getPreferenciasMe(req, res) {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT p.* 
      FROM preferencias p 
      WHERE p.usuario_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Si no hay preferencias, crear unas por defecto
      const defaultPrefs = {
        idioma: 'es',
        tema: 'auto',
        tamanoFuente: 'medium',
        maxResultados: '20',
        categoriasFavoritas: ['ficcion', 'ciencia'],
        emailPrestamos: true,
        emailNuevosLibros: true,
        emailEventos: false,
        appPrestamos: true,
        appRecomendaciones: true,
        appMantenimiento: false
      };
      
      const insertQuery = `
        INSERT INTO preferencias (usuario_id, idioma, tema, tamano_fuente, max_resultados, 
                                categorias_favoritas, email_prestamos, email_nuevos_libros, 
                                email_eventos, app_prestamos, app_recomendaciones, app_mantenimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [
        userId, defaultPrefs.idioma, defaultPrefs.tema, defaultPrefs.tamanoFuente,
        defaultPrefs.maxResultados, defaultPrefs.categoriasFavoritas,
        defaultPrefs.emailPrestamos, defaultPrefs.emailNuevosLibros,
        defaultPrefs.emailEventos, defaultPrefs.appPrestamos,
        defaultPrefs.appRecomendaciones, defaultPrefs.appMantenimiento
      ]);
      
      return res.json(insertResult.rows[0]);
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error obteniendo preferencias del usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

// Actualizar preferencias del usuario actual
async function putPreferenciasMe(req, res) {
  try {
    const userId = req.user.id;
    const {
      idioma,
      tema,
      tamanoFuente,
      maxResultados,
      categoriasFavoritas,
      emailPrestamos,
      emailNuevosLibros,
      emailEventos,
      appPrestamos,
      appRecomendaciones,
      appMantenimiento
    } = req.body;
    
    // Validar datos
    if (idioma && !['es', 'en', 'fr'].includes(idioma)) {
      return res.status(400).json({ error: 'Idioma no válido' });
    }
    
    if (tema && !['auto', 'light', 'dark'].includes(tema)) {
      return res.status(400).json({ error: 'Tema no válido' });
    }
    
    if (tamanoFuente && !['small', 'medium', 'large'].includes(tamanoFuente)) {
      return res.status(400).json({ error: 'Tamaño de fuente no válido' });
    }
    
    if (maxResultados && !['10', '20', '50', '100'].includes(maxResultados)) {
      return res.status(400).json({ error: 'Máximo de resultados no válido' });
    }
    
    // Verificar si ya existen preferencias
    const checkQuery = 'SELECT id FROM preferencias WHERE usuario_id = $1';
    const checkResult = await pool.query(checkQuery, [userId]);
    
    let result;
    
    if (checkResult.rows.length === 0) {
      // Crear nuevas preferencias
      const insertQuery = `
        INSERT INTO preferencias (usuario_id, idioma, tema, tamano_fuente, max_resultados, 
                                categorias_favoritas, email_prestamos, email_nuevos_libros, 
                                email_eventos, app_prestamos, app_recomendaciones, app_mantenimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      result = await pool.query(insertQuery, [
        userId,
        idioma || 'es',
        tema || 'auto',
        tamanoFuente || 'medium',
        maxResultados || '20',
        categoriasFavoritas || ['ficcion', 'ciencia'],
        emailPrestamos !== undefined ? emailPrestamos : true,
        emailNuevosLibros !== undefined ? emailNuevosLibros : true,
        emailEventos !== undefined ? emailEventos : false,
        appPrestamos !== undefined ? appPrestamos : true,
        appRecomendaciones !== undefined ? appRecomendaciones : true,
        appMantenimiento !== undefined ? appMantenimiento : false
      ]);
    } else {
      // Actualizar preferencias existentes
      const updateQuery = `
        UPDATE preferencias 
        SET idioma = COALESCE($2, idioma),
            tema = COALESCE($3, tema),
            tamano_fuente = COALESCE($4, tamano_fuente),
            max_resultados = COALESCE($5, max_resultados),
            categorias_favoritas = COALESCE($6, categorias_favoritas),
            email_prestamos = COALESCE($7, email_prestamos),
            email_nuevos_libros = COALESCE($8, email_nuevos_libros),
            email_eventos = COALESCE($9, email_eventos),
            app_prestamos = COALESCE($10, app_prestamos),
            app_recomendaciones = COALESCE($11, app_recomendaciones),
            app_mantenimiento = COALESCE($12, app_mantenimiento),
            updated_at = CURRENT_TIMESTAMP
        WHERE usuario_id = $1
        RETURNING *
      `;
      
      result = await pool.query(updateQuery, [
        userId,
        idioma,
        tema,
        tamanoFuente,
        maxResultados,
        categoriasFavoritas,
        emailPrestamos,
        emailNuevosLibros,
        emailEventos,
        appPrestamos,
        appRecomendaciones,
        appMantenimiento
      ]);
    }
    
    res.json({
      message: 'Preferencias actualizadas correctamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error actualizando preferencias del usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

// Obtener preferencias de un usuario por ID (para administradores)
async function getPreferenciasById(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el usuario actual sea admin o el propietario
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permisos para ver estas preferencias' });
    }
    
    const query = `
      SELECT p.* 
      FROM preferencias p 
      WHERE p.usuario_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferencias no encontradas' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error obteniendo preferencias por ID:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

// Actualizar preferencias de un usuario por ID (para administradores)
async function putPreferenciasById(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el usuario actual sea admin o el propietario
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar estas preferencias' });
    }
    
    const {
      idioma,
      tema,
      tamanoFuente,
      maxResultados,
      categoriasFavoritas,
      emailPrestamos,
      emailNuevosLibros,
      emailEventos,
      appPrestamos,
      appRecomendaciones,
      appMantenimiento
    } = req.body;
    
    // Validar datos (misma validación que en putPreferenciasMe)
    if (idioma && !['es', 'en', 'fr'].includes(idioma)) {
      return res.status(400).json({ error: 'Idioma no válido' });
    }
    
    if (tema && !['auto', 'light', 'dark'].includes(tema)) {
      return res.status(400).json({ error: 'Tema no válido' });
    }
    
    if (tamanoFuente && !['small', 'medium', 'large'].includes(tamanoFuente)) {
      return res.status(400).json({ error: 'Tamaño de fuente no válido' });
    }
    
    if (maxResultados && !['10', '20', '50', '100'].includes(maxResultados)) {
      return res.status(400).json({ error: 'Máximo de resultados no válido' });
    }
    
    // Verificar si ya existen preferencias
    const checkQuery = 'SELECT id FROM preferencias WHERE usuario_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    let result;
    
    if (checkResult.rows.length === 0) {
      // Crear nuevas preferencias
      const insertQuery = `
        INSERT INTO preferencias (usuario_id, idioma, tema, tamano_fuente, max_resultados, 
                                categorias_favoritas, email_prestamos, email_nuevos_libros, 
                                email_eventos, app_prestamos, app_recomendaciones, app_mantenimiento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      result = await pool.query(insertQuery, [
        id,
        idioma || 'es',
        tema || 'auto',
        tamanoFuente || 'medium',
        maxResultados || '20',
        categoriasFavoritas || ['ficcion', 'ciencia'],
        emailPrestamos !== undefined ? emailPrestamos : true,
        emailNuevosLibros !== undefined ? emailNuevosLibros : true,
        emailEventos !== undefined ? emailEventos : false,
        appPrestamos !== undefined ? appPrestamos : true,
        appRecomendaciones !== undefined ? appRecomendaciones : true,
        appMantenimiento !== undefined ? appMantenimiento : false
      ]);
    } else {
      // Actualizar preferencias existentes
      const updateQuery = `
        UPDATE preferencias 
        SET idioma = COALESCE($2, idioma),
            tema = COALESCE($3, tema),
            tamano_fuente = COALESCE($4, tamano_fuente),
            max_resultados = COALESCE($5, max_resultados),
            categorias_favoritas = COALESCE($6, categorias_favoritas),
            email_prestamos = COALESCE($7, email_prestamos),
            email_nuevos_libros = COALESCE($8, email_nuevos_libros),
            email_eventos = COALESCE($9, email_eventos),
            app_prestamos = COALESCE($10, app_prestamos),
            app_recomendaciones = COALESCE($11, app_recomendaciones),
            app_mantenimiento = COALESCE($12, app_mantenimiento),
            updated_at = CURRENT_TIMESTAMP
        WHERE usuario_id = $1
        RETURNING *
      `;
      
      result = await pool.query(updateQuery, [
        id,
        idioma,
        tema,
        tamanoFuente,
        maxResultados,
        categoriasFavoritas,
        emailPrestamos,
        emailNuevosLibros,
        emailEventos,
        appPrestamos,
        appRecomendaciones,
        appMantenimiento
      ]);
    }
    
    res.json({
      message: 'Preferencias actualizadas correctamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error actualizando preferencias por ID:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}

module.exports = {
  getPreferenciasMe,
  putPreferenciasMe,
  getPreferenciasById,
  putPreferenciasById
};
