const { validationResult } = require('express-validator');
const ticketService = require('../services/ticket.service');

const getTickets = async (req, res, next) => {
  try {
    const result = await ticketService.getAllTickets({ ...req.query, userId: req.user._id, role: req.user.role });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id, req.user);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const ticket = await ticketService.createTicket(req.body, req.user);
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.updateTicket(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

const addNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Note content is required (min 2 characters)' });
    }
    const ticket = await ticketService.addNote(req.params.id, content, req.user);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    await ticketService.deleteTicket(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const stats = await ticketService.getDashboardStats(req.user);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTickets, getTicket, createTicket, updateTicket, addNote, deleteTicket, getDashboard };
