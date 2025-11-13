// src/routes/bibliotecas.routes.js
const express = require('express');
const path = require('node:path');
const router = express.Router();

// 👇 SIEMPRE relativo al archivo actual (sin slash inicial)
const ctrlPath = path.join(__dirname, '..', 'controllers', 'bibliotecas.controller.js');
const raw = require(ctrlPath);
const ctrl = raw?.default ?? raw;

function assertFn(fn, name) {
  if (typeof fn !== 'function') {
    console.error(`❌ Handler inválido: ${name} =`, fn);
    throw new TypeError(`Handler "${name}" debe ser una función`);
  }
}

// sanity
router.get('/ping', (req, res) => res.json({ ok: true, scope: 'bibliotecas' }));

// públicas
assertFn(ctrl.obtenerBibliotecas, 'obtenerBibliotecas');
assertFn(ctrl.obtenerBibliotecaPorId, 'obtenerBibliotecaPorId');
assertFn(ctrl.obtenerLibrosPorBiblioteca, 'obtenerLibrosPorBiblioteca');

router.get('/', ctrl.obtenerBibliotecas);
router.get('/:id', ctrl.obtenerBibliotecaPorId);
router.get('/:id/libros', ctrl.obtenerLibrosPorBiblioteca);

// protegidas
const authMod = require(path.join(__dirname, '..', 'middleware', 'auth.js'));
const auth = authMod.auth || authMod.verifyJWT || authMod.default;
const requireRole = authMod.requireRole;

assertFn(auth, 'auth');
assertFn(requireRole, 'requireRole');

router.use(auth);
router.use(requireRole('admin'));

assertFn(ctrl.crearBiblioteca, 'crearBiblioteca');
assertFn(ctrl.actualizarBiblioteca, 'actualizarBiblioteca');
assertFn(ctrl.eliminarBiblioteca, 'eliminarBiblioteca');

router.post('/', ctrl.crearBiblioteca);
router.put('/:id', ctrl.actualizarBiblioteca);
router.delete('/:id', ctrl.eliminarBiblioteca);

module.exports = router;
