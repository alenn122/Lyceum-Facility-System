const express = require('express');
const router  = express.Router();
const { getStats, getRecentAccess } = require('../controllers/dashboardController');

// GET /api/dashboard/stats
router.get('/stats', getStats);

// GET /api/dashboard/recent-access?limit=10
router.get('/recent-access', getRecentAccess);

module.exports = router;