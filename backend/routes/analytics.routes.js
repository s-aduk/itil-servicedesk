const express = require('express');
const { getAnalyticsData, exportCsv } = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(protect);
router.get('/', getAnalyticsData);
router.get('/export/csv', exportCsv);
module.exports = router;
