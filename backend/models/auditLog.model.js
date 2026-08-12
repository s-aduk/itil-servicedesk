const mongoose = require('mongoose');
const crypto = require('crypto');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    ticketNumber: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    hash: {
      type: String,
    },
    previousHash: {
      type: String,
      default: '0000000000000000', // Genesis block equivalent
    },
  },
  {
    timestamps: true,
  }
);

// Compute hash of this entry (chained ledger pattern)
auditLogSchema.pre('save', async function (next) {
  const AuditLog = mongoose.model('AuditLog');
  // Get the last log entry to chain hashes
  const lastEntry = await AuditLog.findOne().sort({ createdAt: -1 });
  this.previousHash = lastEntry ? lastEntry.hash : '0000000000000000';

  const payload = `${this.action}${this.userId}${this.previousHash}${Date.now()}`;
  this.hash = crypto.createHash('sha256').update(payload).digest('hex');
  next();
});

// Prevent any updates — audit logs are immutable
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function () {
  throw new Error('Audit logs are immutable and cannot be modified.');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
