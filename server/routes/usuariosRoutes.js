const express = require('express');
const router = express.Router();

const {
  listUsers,
  changeRole,
  setBlocked,
  listAudit,
} = require('../Controllers/adminUserController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

// ===============================
// Administración de usuarios
// ===============================

// Obtener usuarios
// GET /api/admin/users
router.get('/users', protect, isAdmin, listUsers);

// Cambiar rol
// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', protect, isAdmin, changeRole);

// Bloquear / desbloquear usuario
// PATCH /api/admin/users/:id/block
router.patch('/users/:id/block', protect, isAdmin, setBlocked);

// Historial de auditoría
// GET /api/admin/audit
router.get('/audit', protect, isAdmin, listAudit);

module.exports = router;