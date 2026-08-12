const Incident     = require('../models/incident.model');
const AuditLog     = require('../models/auditLog.model');
const Notification = require('../models/notification.model');

const VALID_TRANSITIONS = {
  open:        ['in_progress','closed'],
  in_progress: ['pending','resolved','open'],
  pending:     ['in_progress','resolved'],
  resolved:    ['closed','open'],
  closed:      [],
};
const SUPPORT_ROLES = ['admin','tier1','tier2','tier3'];

const getAllTickets = async ({ page=1, limit=20, status, priority, category, search, userId, role }) => {
  const q = {};
  if (role === 'end_user') q.reporter = userId;
  if (status)   q.status   = status;
  if (priority) q.priority = priority;
  if (category) q.category = category;
  if (search)   q.$or = [
    { title:        { $regex:search, $options:'i' } },
    { ticketNumber: { $regex:search, $options:'i' } },
    { description:  { $regex:search, $options:'i' } },
  ];
  const skip = (page-1)*limit;
  const [tickets, total] = await Promise.all([
    Incident.find(q).sort({ createdAt:-1 }).skip(skip).limit(limit)
      .populate('reporter','name email').populate('assignee','name email'),
    Incident.countDocuments(q),
  ]);
  return { tickets, pagination:{ total, page:Number(page), pages:Math.ceil(total/limit), limit:Number(limit) } };
};

const getTicketById = async (ticketId, user) => {
  const t = await Incident.findById(ticketId)
    .populate('reporter','name email role').populate('assignee','name email role');
  if (!t) throw Object.assign(new Error('Ticket not found'), { statusCode:404 });
  if (user.role==='end_user' && t.reporter._id.toString()!==user._id.toString())
    throw Object.assign(new Error('Not authorised'), { statusCode:403 });
  return t;
};

const createTicket = async (data, user) => {
  const ticket = await Incident.create({ ...data, reporter:user._id, reporterName:user.name });
  await AuditLog.create({
    action:'TICKET_CREATED', userId:user._id, userName:user.name,
    ticketId:ticket._id, ticketNumber:ticket.ticketNumber,
    details:{ title:ticket.title, category:ticket.category, priority:ticket.priority },
  });
  return ticket;
};

const updateTicket = async (ticketId, updates, user) => {
  const ticket = await Incident.findById(ticketId);
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode:404 });

  if (updates.status && updates.status !== ticket.status) {
    const allowed = VALID_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(updates.status))
      throw Object.assign(new Error(`Cannot transition from '${ticket.status}' to '${updates.status}'`), { statusCode:422 });
  }
  if (!ticket.firstResponseAt && SUPPORT_ROLES.includes(user.role)) {
    ticket.firstResponseAt = new Date();
    ticket.slaResponseMet  = ticket.firstResponseAt <= ticket.slaResponseDeadline;
  }

  const prevAssignee = ticket.assignee?.toString();
  const prevStatus   = ticket.status;
  const allowed = ['title','description','category','status','assignee','assigneeName','priority'];
  allowed.forEach(f => { if (updates[f]!==undefined) ticket[f] = updates[f]; });
  await ticket.save();

  if (updates.assignee && updates.assignee !== prevAssignee) {
    await Notification.create({
      recipient:updates.assignee, type:'ticket_assigned',
      title:`Assigned: ${ticket.ticketNumber}`,
      message:`You have been assigned "${ticket.title}" (${ticket.priority} priority).`,
      ticketId:ticket._id, ticketNumber:ticket.ticketNumber,
    });
  }
  if (updates.status && updates.status !== prevStatus) {
    await Notification.create({
      recipient:ticket.reporter, type:'status_changed',
      title:`Status Update: ${ticket.ticketNumber}`,
      message:`Your ticket "${ticket.title}" status changed to "${updates.status}".`,
      ticketId:ticket._id, ticketNumber:ticket.ticketNumber,
    });
  }

  await AuditLog.create({
    action:'TICKET_UPDATED', userId:user._id, userName:user.name,
    ticketId:ticket._id, ticketNumber:ticket.ticketNumber, details:{ updates },
  });
  return ticket;
};

const addNote = async (ticketId, content, user) => {
  const ticket = await Incident.findById(ticketId);
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode:404 });
  ticket.resolutionNotes.push({ content, addedBy:user._id, addedByName:user.name });
  if (!ticket.firstResponseAt && SUPPORT_ROLES.includes(user.role)) {
    ticket.firstResponseAt = new Date();
    ticket.slaResponseMet  = ticket.firstResponseAt <= ticket.slaResponseDeadline;
  }
  await ticket.save();
  if (ticket.reporter.toString() !== user._id.toString()) {
    await Notification.create({
      recipient:ticket.reporter, type:'note_added',
      title:`Note Added: ${ticket.ticketNumber}`,
      message:`${user.name} added a note to your ticket "${ticket.title}".`,
      ticketId:ticket._id, ticketNumber:ticket.ticketNumber,
    });
  }
  await AuditLog.create({
    action:'NOTE_ADDED', userId:user._id, userName:user.name,
    ticketId:ticket._id, ticketNumber:ticket.ticketNumber, details:{ noteLength:content.length },
  });
  return ticket;
};

const deleteTicket = async (ticketId, user) => {
  const ticket = await Incident.findById(ticketId);
  if (!ticket) throw Object.assign(new Error('Ticket not found'), { statusCode:404 });
  await ticket.deleteOne();
  await AuditLog.create({
    action:'TICKET_DELETED', userId:user._id, userName:user.name,
    ticketId:ticket._id, ticketNumber:ticket.ticketNumber, details:{},
  });
};

const getDashboardStats = async (user) => {
  const base = user.role==='end_user' ? { reporter:user._id } : {};
  const [total, open, inProgress, resolved, critical, slaBreached] = await Promise.all([
    Incident.countDocuments(base),
    Incident.countDocuments({ ...base, status:'open' }),
    Incident.countDocuments({ ...base, status:'in_progress' }),
    Incident.countDocuments({ ...base, status:'resolved' }),
    Incident.countDocuments({ ...base, priority:'critical', status:{ $nin:['resolved','closed'] } }),
    Incident.countDocuments({ ...base, slaBreached:true, status:{ $nin:['resolved','closed'] } }),
  ]);
  return { total, open, inProgress, resolved, critical, slaBreached };
};

module.exports = { getAllTickets, getTicketById, createTicket, updateTicket, addNote, deleteTicket, getDashboardStats };
