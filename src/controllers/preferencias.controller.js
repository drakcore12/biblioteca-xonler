const { success, notFound, badRequest, forbidden } = require('../utils/http-response');
const { asyncHandler } = require('../utils/error-handler');
const {
  getPreferencesByUserId,
  createDefaultPreferences,
  upsertPreferences,
  validatePreferences
} = require('../utils/preferencias-helpers');

// Obtener preferencias del usuario actual
const getPreferenciasMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  let preferencias = await getPreferencesByUserId(userId);
  
  if (!preferencias) {
    // Si no hay preferencias, crear unas por defecto
    preferencias = await createDefaultPreferences(userId);
  }
  
  return success(res, preferencias);
});

// Actualizar preferencias del usuario actual
const putPreferenciasMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const preferencias = req.body;
  
  // Validar datos
  const validation = validatePreferences(preferencias);
  if (!validation.valid) {
    return badRequest(res, validation.error);
  }
  
  // Upsert preferencias
  const result = await upsertPreferences(userId, preferencias);
  
  return success(res, result, 'Preferencias actualizadas correctamente');
});

// Obtener preferencias de un usuario por ID (para administradores)
const getPreferenciasById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUserId = Number.parseInt(id, 10);
  
  // Verificar que el usuario actual sea admin o el propietario
  if (req.user.role !== 'admin' && req.user.role !== 'supadmin' && req.user.id !== targetUserId) {
    return forbidden(res, 'No tienes permisos para ver estas preferencias');
  }
  
  const preferencias = await getPreferencesByUserId(targetUserId);
  
  if (!preferencias) {
    return notFound(res, 'Preferencias no encontradas');
  }
  
  return success(res, preferencias);
});

// Actualizar preferencias de un usuario por ID (para administradores)
const putPreferenciasById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUserId = Number.parseInt(id, 10);
  
  // Verificar que el usuario actual sea admin o el propietario
  if (req.user.role !== 'admin' && req.user.role !== 'supadmin' && req.user.id !== targetUserId) {
    return forbidden(res, 'No tienes permisos para modificar estas preferencias');
  }
  
  const preferencias = req.body;
  
  // Validar datos
  const validation = validatePreferences(preferencias);
  if (!validation.valid) {
    return badRequest(res, validation.error);
  }
  
  // Upsert preferencias
  const result = await upsertPreferences(targetUserId, preferencias);
  
  return success(res, result, 'Preferencias actualizadas correctamente');
});

module.exports = {
  getPreferenciasMe,
  putPreferenciasMe,
  getPreferenciasById,
  putPreferenciasById
};
