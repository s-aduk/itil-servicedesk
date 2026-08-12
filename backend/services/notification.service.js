const Notification = require('../models/notification.model');
const getNotifications = async (userId, { unreadOnly=false, limit=30 }={}) => {
  const q = { recipient:userId };
  if (unreadOnly) q.read = false;
  return Notification.find(q).sort({ createdAt:-1 }).limit(Number(limit));
};
const getUnreadCount = async (userId) => Notification.countDocuments({ recipient:userId, read:false });
const markRead = async (id, userId) =>
  Notification.findOneAndUpdate({ _id:id, recipient:userId }, { read:true }, { new:true });
const markAllRead = async (userId) =>
  Notification.updateMany({ recipient:userId, read:false }, { read:true });
module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
