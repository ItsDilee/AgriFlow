const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    centre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Centre',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'skipped', 'abandoned'],
      default: 'waiting',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    expectedTime: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Optimize looking up the active queue by center
queueSchema.index({ centre: 1, status: 1 });
queueSchema.index({ appointment: 1 });

module.exports = mongoose.model('Queue', queueSchema);
