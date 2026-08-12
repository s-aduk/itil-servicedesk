const Incident = require('../models/incident.model');

const getAnalytics = async ({ from, to, role, userId } = {}) => {
  const base = role === 'end_user' ? { reporter: userId } : {};
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to)   dateFilter.$lte = new Date(to);
  if (from || to) base.createdAt = dateFilter;

  // Parallel aggregations
  const [
    byStatus, byPriority, byCategory,
    dailyVolume, slaStats, mttrData, escalationCount,
  ] = await Promise.all([
    // By status
    Incident.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    // By priority
    Incident.aggregate([{ $match: base }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    // By category
    Incident.aggregate([{ $match: base }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    // Daily volume (last 30 days)
    Incident.aggregate([
      { $match: { ...base, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // SLA compliance
    Incident.aggregate([
      { $match: { ...base, status: { $in: ['resolved', 'closed'] } } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        met:   { $sum: { $cond: ['$slaResolutionMet', 1, 0] } },
        breached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
      }},
    ]),
    // MTTR by priority
    Incident.aggregate([
      { $match: { ...base, resolvedAt: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$priority',
        avgMttrMinutes: { $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 60000] } },
        count: { $sum: 1 },
      }},
    ]),
    // Escalation count
    Incident.countDocuments({ ...base, 'escalations.0': { $exists: true } }),
  ]);

  const sla = slaStats[0] || { total: 0, met: 0, breached: 0 };

  return {
    summary: {
      total: await Incident.countDocuments(base),
      open: await Incident.countDocuments({ ...base, status: 'open' }),
      resolved: await Incident.countDocuments({ ...base, status: { $in: ['resolved', 'closed'] } }),
      slaCompliancePercent: sla.total ? Math.round((sla.met / sla.total) * 100) : null,
      slaBreachedCount: sla.breached,
      escalationCount,
    },
    byStatus:   byStatus.map(x  => ({ status:   x._id, count: x.count })),
    byPriority: byPriority.map(x => ({ priority: x._id, count: x.count })),
    byCategory: byCategory.map(x => ({ category: x._id, count: x.count })),
    dailyVolume: dailyVolume.map(x => ({ date: x._id, count: x.count })),
    mttr: mttrData.map(x => ({ priority: x._id, avgMinutes: Math.round(x.avgMttrMinutes), count: x.count })),
    sla: { ...sla, compliancePercent: sla.total ? Math.round((sla.met / sla.total) * 100) : null },
  };
};

// CSV export helper
const generateCsv = (tickets) => {
  const headers = ['Ticket #','Title','Category','Priority','Status','Reporter','Assignee','Created','Resolved','MTTR (min)','SLA Met','SLA Breached'];
  const rows = tickets.map(t => [
    t.ticketNumber, `"${t.title.replace(/"/g, '""')}"`, t.category, t.priority, t.status,
    t.reporterName, t.assigneeName || '', 
    new Date(t.createdAt).toISOString(),
    t.resolvedAt ? new Date(t.resolvedAt).toISOString() : '',
    t.resolvedAt ? Math.round((new Date(t.resolvedAt) - new Date(t.createdAt)) / 60000) : '',
    t.slaResolutionMet ?? '', t.slaBreached,
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
};

module.exports = { getAnalytics, generateCsv };
