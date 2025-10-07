const librosService = require('../services/libros.service');
const AppError = require('../utils/app-error');

function handleControllerError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);

  if (error instanceof AppError) {
    const payload = { error: error.message };
    if (error.details) {
      payload.details = error.details;
    }
    return res.status(error.statusCode).json(payload);
  }

  if (error.code === '42P01') {
    return res.status(500).json({ error: 'Tabla libros no encontrada' });
  }

  if (error.code === '42703') {
    return res.status(500).json({ error: 'Columna no encontrada en tabla libros' });
  }

  return res.status(500).json({ error: fallbackMessage });
}

async function obtenerLibros(req, res) {
  try {
    const resultado = await librosService.searchLibros(req.query);
    return res.json(resultado);
  } catch (error) {
    return handleControllerError(res, error, 'Error listando libros');
  }
}

async function obtenerLibroPorId(req, res) {
  try {
    const libro = await librosService.findLibroById(req.params.id);
    if (!libro) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    return res.json(libro);
  } catch (error) {
    return handleControllerError(res, error, 'Error obteniendo libro');
  }
}

async function crearLibro(req, res) {
  try {
    const libro = await librosService.createLibro(req.body);
    return res.status(201).json({
      message: 'Libro creado exitosamente',
      libro
    });
  } catch (error) {
    return handleControllerError(res, error, 'Error interno del servidor');
  }
}

async function actualizarLibro(req, res) {
  try {
    const libro = await librosService.updateLibro(req.params.id, req.body);
    return res.json({
      message: 'Libro actualizado exitosamente',
      libro
    });
  } catch (error) {
    return handleControllerError(res, error, 'Error interno del servidor');
  }
}

async function eliminarLibro(req, res) {
  try {
    await librosService.deleteLibro(req.params.id);
    return res.json({ message: 'Libro eliminado exitosamente' });
  } catch (error) {
    return handleControllerError(res, error, 'Error interno del servidor');
  }
}

async function subirImagenLibro(req, res) {
  try {
    if (!req.file) {
      throw new AppError('No se proporcionó ninguna imagen', 400);
    }

    const imagenUrl = `/uploads/libros/${req.file.filename}`;
    const libro = await librosService.updateLibroImage(req.params.id, imagenUrl);

    return res.json({
      message: 'Imagen del libro actualizada exitosamente',
      libro
    });
  } catch (error) {
    return handleControllerError(res, error, 'Error interno del servidor');
  }
}

async function obtenerRecomendaciones(req, res) {
  try {
    const userId = req.user?.id;
    const resultado = await librosService.obtenerRecomendaciones(userId);
    return res.json(resultado);
  } catch (error) {
    return handleControllerError(res, error, 'Error obteniendo recomendaciones');
  }
}

module.exports = {
  obtenerLibros,
  obtenerLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
  subirImagenLibro,
  obtenerRecomendaciones
};
