const express = require('express');
const { body } = require('express-validator');
const { getTickets, getTicket, createTicket, updateTicket, addNote, deleteTicket, getDashboard } = require('../controllers/ticket.controller');
const { escalateTicket } = require('../controllers/escalation.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const router = express.Router();
router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/', getTickets);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ min:5 }).withMessage('Min 5 chars'),
  body('description').trim().notEmpty().withMessage('Description required').isLength({ min:10 }).withMessage('Min 10 chars'),
  body('category').notEmpty().withMessage('Category required')
    .isIn(['access_management','service_interruption','hardware_software','data_integrity','general_inquiry']).withMessage('Invalid category'),
], createTicket);
router.get('/:id', getTicket);
router.patch('/:id', authorize('admin','tier1','tier2','tier3'), updateTicket);
router.post('/:id/notes', addNote);
router.post('/:id/escalate', authorize('admin','tier1','tier2','tier3'), escalateTicket);
router.delete('/:id', authorize('admin'), deleteTicket);
module.exports = router;
