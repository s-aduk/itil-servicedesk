const express = require('express');
const { getNotifications, markRead, markAllRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(protect);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
module.exports = router;
