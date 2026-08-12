const kbService = require('../services/knowledge.service');
const { getAiSuggestion } = require('../services/ai.service');
const Incident = require('../models/incident.model');

const getArticles = async (req, res, next) => {
  try { res.json({ success: true, ...(await kbService.getArticles(req.query)) }); } catch (e) { next(e); }
};
const getArticle = async (req, res, next) => {
  try {
    const article = await kbService.getArticleById(req.params.id);
    const related = await kbService.getRelatedArticles(article.category, article._id);
    res.json({ success: true, data: article, related });
  } catch (e) { next(e); }
};
const createArticle = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await kbService.createArticle(req.body, req.user) }); } catch (e) { next(e); }
};
const updateArticle = async (req, res, next) => {
  try { res.json({ success: true, data: await kbService.updateArticle(req.params.id, req.body) }); } catch (e) { next(e); }
};
const deleteArticle = async (req, res, next) => {
  try { await kbService.deleteArticle(req.params.id); res.json({ success: true }); } catch (e) { next(e); }
};
const voteArticle = async (req, res, next) => {
  try { res.json({ success: true, data: await kbService.voteArticle(req.params.id, req.body.helpful) }); } catch (e) { next(e); }
};
const getAiSuggestionForTicket = async (req, res, next) => {
  try {
    const ticket = await Incident.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const related = await kbService.getRelatedArticles(ticket.category, null, 3);
    const suggestion = await getAiSuggestion(ticket, related);
    res.json({ success: true, data: suggestion });
  } catch (e) { next(e); }
};

module.exports = { getArticles, getArticle, createArticle, updateArticle, deleteArticle, voteArticle, getAiSuggestionForTicket };
