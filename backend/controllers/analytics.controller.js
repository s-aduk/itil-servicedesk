const { getAnalytics, generateCsv } = require('../services/analytics.service');
const Incident = require('../models/incident.model');

const getAnalyticsData = async (req, res, next) => {
  try {
    const data = await getAnalytics({ ...req.query, role: req.user.role, userId: req.user._id });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const exportCsv = async (req, res, next) => {
  try {
    const base = req.user.role === 'end_user' ? { reporter: req.user._id } : {};
    const tickets = await Incident.find(base).sort({ createdAt: -1 }).limit(5000);
    const csv = generateCsv(tickets);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="servicedesk-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
};

module.exports = { getAnalyticsData, exportCsv };
