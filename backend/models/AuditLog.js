const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  targetModel: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  centre: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', default: null },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
}, { timestamps: true });

auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ centre: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
