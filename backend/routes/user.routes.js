const express = require('express');
const { getUsers, getUserById, updateUser } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'tier1', 'tier2', 'tier3'), getUsers);
router.get('/:id', authorize('admin'), getUserById);
router.patch('/:id', authorize('admin'), updateUser);

module.exports = router;
