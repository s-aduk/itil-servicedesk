const { getAnalytics } = require('../services/analytics.service');
const Incident  = require('../models/incident.model');
const AuditLog  = require('../models/auditLog.model');
const User      = require('../models/user.model');

// In-memory cache (60s TTL)
const _cache = {};
const cached = (key, fn) => {
  const entry = _cache[key];
  if (entry && entry.exp > Date.now()) return Promise.resolve(entry.data);
  return fn().then(data => { _cache[key] = { data, exp: Date.now() + 60000 }; return data; });
};

const buildDateMatch = (from, to) => {
  const m = {};
  if (from || to) {
    m.createdAt = {};
    if (from) m.createdAt.$gte = new Date(from);
    if (to)   m.createdAt.$lte = new Date(to);
  }
  return m;
};

// GET /api/reports/summary
// Full analytics summary (wraps existing analytics service)
const getSummary = async (req, res, next) => {
  try {
    const data = await getAnalytics({ ...req.query, role: req.user.role, userId: req.user._id });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// GET /api/reports/sla-compliance
const getSLACompliance = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const key = `sla:${from}:${to}`;
    const data = await cached(key, async () => {
      const match = buildDateMatch(from, to);
      return Incident.aggregate([
        { $match: match },
        { $group: {
          _id: '$priority',
          total:    { $sum: 1 },
          breached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          met:      { $sum: { $cond: ['$slaResolutionMet', 1, 0] } },
          avgMttrMinutes: {
            $avg: {
              $cond: [
                '$resolvedAt',
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 60000] },
                null
              ]
            }
          }
        }},
        { $project: {
          priority: '$_id', _id: 0,
          total: 1, breached: 1, met: 1,
          complianceRate: {
            $cond: [
              { $eq: ['$total', 0] }, 100,
              { $multiply: [{ $divide: ['$met', '$total'] }, 100] }
            ]
          },
          avgMttrMinutes: { $round: ['$avgMttrMinutes', 1] }
        }},
        { $sort: { priority: 1 } }
      ]);
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// GET /api/reports/ticket-volume?granularity=daily|weekly|monthly
const getTicketVolume = async (req, res, next) => {
  try {
    const { from, to, granularity = 'daily' } = req.query;
    const key = `vol:${from}:${to}:${granularity}`;
    const data = await cached(key, async () => {
      const match = buildDateMatch(from, to);
      const fmt = { daily: '%Y-%m-%d', weekly: '%Y-%V', monthly: '%Y-%m' }[granularity] || '%Y-%m-%d';
      return Incident.aggregate([
        { $match: match },
        { $group: {
          _id: {
            period: { $dateToString: { format: fmt, date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }},
        { $group: {
          _id: '$_id.period',
          total:    { $sum: '$count' },
          byStatus: { $push: { status: '$_id.status', count: '$count' } }
        }},
        { $project: { period: '$_id', _id: 0, total: 1, byStatus: 1 } },
        { $sort: { period: 1 } }
      ]);
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// GET /api/reports/agent-performance
const getAgentPerformance = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const key = `agent:${from}:${to}`;
    const data = await cached(key, async () => {
      const match = { ...buildDateMatch(from, to), assignee: { $exists: true, $ne: null } };
      return Incident.aggregate([
        { $match: match },
        { $lookup: { from: 'users', localField: 'assignee', foreignField: '_id', as: 'agentDoc' } },
        { $unwind: '$agentDoc' },
        { $group: {
          _id: '$assignee',
          agentName:  { $first: '$agentDoc.name' },
          agentEmail: { $first: '$agentDoc.email' },
          total:    { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          breached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
          avgMttr:  { $avg: {
            $cond: ['$resolvedAt', { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 60000] }, null]
          }}
        }},
        { $project: {
          _id: 0, agentId: '$_id', agentName: 1, agentEmail: 1,
          total: 1, resolved: 1, breached: 1,
          resolutionRate: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }] },
          breachRate:     { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$breached', '$total'] }, 100] }] },
          avgMttrMinutes: { $round: ['$avgMttr', 1] }
        }},
        { $sort: { resolutionRate: -1 } }
      ]);
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// GET /api/reports/category-breakdown
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const key = `cat:${from}:${to}`;
    const data = await cached(key, async () => {
      const match = buildDateMatch(from, to);
      return Incident.aggregate([
        { $match: match },
        { $group: {
          _id: '$category',
          total:    { $sum: 1 },
          open:     { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          breached: { $sum: { $cond: ['$slaBreached', 1, 0] } }
        }},
        { $project: { category: '$_id', _id: 0, total: 1, open: 1, resolved: 1, breached: 1 } },
        { $sort: { total: -1 } }
      ]);
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// GET /api/reports/audit-export?format=csv|json
const exportAuditLog = async (req, res, next) => {
  try {
    const { from, to, format = 'csv' } = req.query;
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(to);
    }

    const logs = await AuditLog.find(match).sort({ createdAt: -1 }).lean();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.json"`);
      return res.json(logs);
    }

    // CSV
    const headers = ['timestamp', 'action', 'userName', 'ticketNumber', 'details', 'hash'];
    const rows = logs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.userName,
      l.ticketNumber || '',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
      l.hash || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.csv"`);
    res.send(csv);
  } catch (e) { next(e); }
};

module.exports = { getSummary, getSLACompliance, getTicketVolume, getAgentPerformance, getCategoryBreakdown, exportAuditLog };
