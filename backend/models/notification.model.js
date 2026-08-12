const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  recipient: { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  type: { type:String, enum:['sla_warning','sla_breach','escalation','ticket_assigned','status_changed','note_added'], required:true },
  title:   { type:String, required:true },
  message: { type:String, required:true },
  ticketId:     { type:mongoose.Schema.Types.ObjectId, ref:'Incident', default:null },
  ticketNumber: { type:String, default:null },
  read: { type:Boolean, default:false },
},{ timestamps:true });
notificationSchema.index({ recipient:1, read:1, createdAt:-1 });
module.exports = mongoose.model('Notification', notificationSchema);
