const AuditLog = require('../models/auditLog.model');

const getAuditLogs = async (req, res, next) => {
  try {
    const { ticketNumber, action, userId, page = 1, limit = 50 } = req.query;
    const q = {};
    if (ticketNumber) q.ticketNumber = { $regex: ticketNumber, $options: 'i' };
    if (action)       q.action = action;
    if (userId)       q.userId = userId;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(q),
    ]);
    res.json({ success: true, data: logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
};

const verifyChain = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: 1 });
    const crypto = require('crypto');
    let valid = true;
    const results = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const expectedPrev = i === 0 ? '0000000000000000' : logs[i - 1].hash;
      const chainOk = log.previousHash === expectedPrev;
      if (!chainOk) valid = false;
      results.push({ id: log._id, action: log.action, createdAt: log.createdAt, chainOk });
    }
    res.json({ success: true, data: { valid, totalEntries: logs.length, results: results.slice(-20) } });
  } catch (e) { next(e); }
};

module.exports = { getAuditLogs, verifyChain };
