const express = require('express');
const { getAuditLogs, verifyChain } = require('../controllers/audit.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(protect, authorize('admin', 'tier1', 'tier2', 'tier3'));
router.get('/', getAuditLogs);
router.get('/verify', verifyChain);
module.exports = router;
