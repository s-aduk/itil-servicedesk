const svc = require('../services/notification.service');
const getNotifications = async (req,res,next) => {
  try {
    const { unread, limit } = req.query;
    const notifications = await svc.getNotifications(req.user._id, { unreadOnly:unread==='true', limit });
    const unreadCount   = await svc.getUnreadCount(req.user._id);
    res.json({ success:true, data:notifications, unreadCount });
  } catch(e){ next(e); }
};
const markRead = async (req,res,next) => {
  try {
    const n = await svc.markRead(req.params.id, req.user._id);
    if (!n) return res.status(404).json({ success:false, message:'Notification not found' });
    res.json({ success:true, data:n });
  } catch(e){ next(e); }
};
const markAllRead = async (req,res,next) => {
  try { await svc.markAllRead(req.user._id); res.json({ success:true }); }
  catch(e){ next(e); }
};
module.exports = { getNotifications, markRead, markAllRead };
