const mongoose = require('mongoose');
const { SLA_TARGETS } = require('../config/sla.config');

const CATEGORIES = ['access_management','service_interruption','hardware_software','data_integrity','general_inquiry'];
const PRIORITIES = ['critical','high','medium','low'];
const STATUSES   = ['open','in_progress','pending','resolved','closed'];
const PRIORITY_RULES = { service_interruption:'critical', access_management:'high', hardware_software:'medium', data_integrity:'high', general_inquiry:'low' };

const resolutionNoteSchema = new mongoose.Schema(
  { content:{type:String,required:true,trim:true}, addedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}, addedByName:{type:String,required:true} },
  { timestamps:true }
);
const escalationSchema = new mongoose.Schema(
  { escalatedAt:{type:Date,required:true}, escalatedTo:{type:String,required:true}, reason:{type:String,required:true}, triggeredBy:{type:String,default:'system'} },
  { _id:false }
);

const incidentSchema = new mongoose.Schema({
  ticketNumber: { type:String, unique:true },
  title:        { type:String, required:[true,'Title is required'], trim:true, minlength:5, maxlength:150 },
  description:  { type:String, required:[true,'Description is required'], trim:true, minlength:10 },
  category:     { type:String, enum:{values:CATEGORIES,message:'{VALUE} not valid'}, required:true },
  priority:     { type:String, enum:{values:PRIORITIES,message:'{VALUE} not valid'} },
  status:       { type:String, enum:{values:STATUSES,message:'{VALUE} not valid'}, default:'open' },
  reporter:     { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  reporterName: { type:String, required:true },
  assignee:     { type:mongoose.Schema.Types.ObjectId, ref:'User', default:null },
  assigneeName: { type:String, default:null },
  // SLA
  slaResponseDeadline:   { type:Date, default:null },
  slaResolutionDeadline: { type:Date, default:null },
  slaResponseMet:        { type:Boolean, default:null },
  slaResolutionMet:      { type:Boolean, default:null },
  slaBreached:           { type:Boolean, default:false },
  slaWarningIssued:      { type:Boolean, default:false },
  firstResponseAt:       { type:Date, default:null },
  // Escalation
  escalations:            [escalationSchema],
  currentEscalationTier:  { type:String, default:null },
  resolutionNotes: [resolutionNoteSchema],
  resolvedAt: { type:Date, default:null },
  closedAt:   { type:Date, default:null },
},{ timestamps:true, toJSON:{virtuals:true}, toObject:{virtuals:true} });

incidentSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Incident').countDocuments();
    this.ticketNumber = `TKT-${new Date().getFullYear()}${String(count+1).padStart(4,'0')}`;
  }
  if (!this.priority && this.category) this.priority = PRIORITY_RULES[this.category] || 'low';
  if (this.isNew && this.priority) {
    const t = SLA_TARGETS[this.priority]; const now = new Date();
    this.slaResponseDeadline   = new Date(now.getTime() + t.responseMinutes*60000);
    this.slaResolutionDeadline = new Date(now.getTime() + t.resolutionMinutes*60000);
  }
  if (!this.isNew && this.isModified('priority') && this.priority) {
    const t = SLA_TARGETS[this.priority]; const base = this.createdAt || new Date();
    this.slaResponseDeadline   = new Date(base.getTime() + t.responseMinutes*60000);
    this.slaResolutionDeadline = new Date(base.getTime() + t.resolutionMinutes*60000);
  }
  if (this.isModified('status') && this.status==='resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.slaResolutionMet = this.resolvedAt <= this.slaResolutionDeadline;
    if (!this.slaResolutionMet) this.slaBreached = true;
  }
  if (this.isModified('status') && this.status==='closed' && !this.closedAt) this.closedAt = new Date();
  next();
});

incidentSchema.virtual('slaElapsedPercent').get(function() {
  if (!this.slaResolutionDeadline || !this.createdAt) return null;
  return Math.min(100, Math.round(((Date.now()-this.createdAt)/(this.slaResolutionDeadline-this.createdAt))*100));
});
incidentSchema.virtual('slaMinutesRemaining').get(function() {
  if (!this.slaResolutionDeadline) return null;
  return Math.round((this.slaResolutionDeadline - Date.now())/60000);
});
incidentSchema.virtual('mttrMinutes').get(function() {
  if (this.resolvedAt && this.createdAt) return Math.round((this.resolvedAt-this.createdAt)/60000);
  return null;
});

module.exports = mongoose.model('Incident', incidentSchema);
