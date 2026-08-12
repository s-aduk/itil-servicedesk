const Incident      = require('../models/incident.model');
const Notification  = require('../models/notification.model');
const AuditLog      = require('../models/auditLog.model');
const User          = require('../models/user.model');
const { ESCALATION_THRESHOLDS } = require('../config/sla.config');

const _notifyGroup = async (ticket, type, title, message, recipientIds) => {
  const unique = [...new Set(recipientIds.map(String))];
  await Promise.all(unique.map(id =>
    Notification.create({ recipient:id, type, title, message, ticketId:ticket._id, ticketNumber:ticket.ticketNumber })
  ));
};

const _escalate = async (ticket, targetTier, reason) => {
  ticket.escalations.push({ escalatedAt:new Date(), escalatedTo:targetTier, reason, triggeredBy:'system' });
  ticket.currentEscalationTier = targetTier;
  const engineers = await User.find({ role:targetTier, isActive:true });
  if (engineers.length && !ticket.assignee) {
    ticket.assignee     = engineers[0]._id;
    ticket.assigneeName = engineers[0].name;
  }
  await _notifyGroup(ticket, 'escalation',
    `Escalation: ${ticket.ticketNumber}`,
    `"${ticket.title}" auto-escalated to ${targetTier.toUpperCase()}. ${reason}`,
    engineers.map(e => e._id)
  );
  await AuditLog.create({
    action:'TICKET_ESCALATED', userId:ticket.reporter, userName:'System',
    ticketId:ticket._id, ticketNumber:ticket.ticketNumber, details:{ targetTier, reason },
  });
};

const runSlaChecks = async () => {
  const tickets = await Incident.find({ status:{ $in:['open','in_progress','pending'] }, slaBreached:false });
  for (const ticket of tickets) {
    const total   = ticket.slaResolutionDeadline - ticket.createdAt;
    const elapsed = Date.now() - ticket.createdAt;
    const ratio   = elapsed / total;
    let changed   = false;
    const admins  = await User.find({ role:'admin', isActive:true }).select('_id');
    const recipients = [...(ticket.assignee ? [ticket.assignee] : []), ...admins.map(a=>a._id)];

    if (ratio >= ESCALATION_THRESHOLDS.tier2 && !ticket.slaWarningIssued) {
      ticket.slaWarningIssued = true; changed = true;
      await _notifyGroup(ticket, 'sla_warning',
        `SLA Warning: ${ticket.ticketNumber}`,
        `"${ticket.title}" has used 75% of its SLA window (${ticket.priority} priority).`,
        recipients);
    }
    if (Date.now() > ticket.slaResolutionDeadline) {
      ticket.slaBreached = true; ticket.slaResolutionMet = false; changed = true;
      await _notifyGroup(ticket, 'sla_breach',
        `SLA Breached: ${ticket.ticketNumber}`,
        `"${ticket.title}" has breached its SLA deadline. Immediate action required.`,
        recipients);
    }
    if (ratio >= ESCALATION_THRESHOLDS.tier2 && !ticket.currentEscalationTier) {
      await _escalate(ticket, 'tier2', 'SLA 75% elapsed — auto-escalated to Tier-2'); changed = true;
    }
    if (ratio >= ESCALATION_THRESHOLDS.tier3 && ticket.currentEscalationTier === 'tier2') {
      await _escalate(ticket, 'tier3', 'SLA 90% elapsed — auto-escalated to Tier-3'); changed = true;
    }
    if (changed) await ticket.save();
  }
};

const manualEscalate = async (ticketId, targetTier, reason, actingUser) => {
  const ticket = await Incident.findById(ticketId);
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode:404 });
  ticket.escalations.push({ escalatedAt:new Date(), escalatedTo:targetTier, reason, triggeredBy:actingUser._id.toString() });
  ticket.currentEscalationTier = targetTier;
  await ticket.save();
  const engineers = await User.find({ role:targetTier, isActive:true });
  await _notifyGroup(ticket, 'escalation',
    `Manual Escalation: ${ticket.ticketNumber}`,
    `"${ticket.title}" manually escalated to ${targetTier.toUpperCase()} by ${actingUser.name}. Reason: ${reason}`,
    engineers.map(e=>e._id)
  );
  await AuditLog.create({
    action:'TICKET_ESCALATED_MANUAL', userId:actingUser._id, userName:actingUser.name,
    ticketId:ticket._id, ticketNumber:ticket.ticketNumber, details:{ targetTier, reason },
  });
  return ticket;
};

module.exports = { runSlaChecks, manualEscalate };
