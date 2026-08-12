const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getSummary,
  getSLACompliance,
  getTicketVolume,
  getAgentPerformance,
  getCategoryBreakdown,
  exportAuditLog
} = require('../controllers/report.controller');

const router = express.Router();

// All report routes require authentication + manager or admin role
router.use(protect);
router.use(authorize('admin', 'tier1', 'tier2', 'tier3'));

router.get('/summary',            getSummary);
router.get('/sla-compliance',     getSLACompliance);
router.get('/ticket-volume',      getTicketVolume);
router.get('/agent-performance',  getAgentPerformance);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/audit-export',       exportAuditLog);

module.exports = router;
