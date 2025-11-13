const { getAllRecords, getRecordById } = require('../utils/controller-helpers');

// Obtener todos los roles
const obtenerRoles = getAllRecords('roles', 'id, name', 'id');

// Obtener rol por ID
const obtenerRolPorId = getRecordById('roles', 'id, name', 'id');

module.exports = {
  obtenerRoles,
  obtenerRolPorId
};