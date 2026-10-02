const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { getStats } = require('../Controllers/adminStatsController');
const {
  listUsers,
  changeRole,
  setBlocked,
  listAudit,
} = require('../Controllers/adminUserController');
const {
  listReports,
  updateReportStatus,
} = require('../Controllers/adminReportsController');
const {
  listReviews,
  getStoreFeedback,
} = require('../Controllers/adminReviewsController');

// Todas las rutas de /api/admin exigen token válido + rol admin
router.use(protect, isAdmin);

// Fase 1
router.get('/stats', getStats);

// Fase 2
router.get('/users', listUsers);
router.patch('/users/:id/role', changeRole);
router.patch('/users/:id/block', setBlocked);
router.get('/audit', listAudit);

// Fase 3
router.get('/reports', listReports);
router.patch('/reports/:id/status', updateReportStatus);
router.get('/reviews', listReviews);
router.get('/feedback', getStoreFeedback);

module.exports = router;