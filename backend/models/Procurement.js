const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
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
    commodity: {
      type: String,
      required: true,
    },
    actualQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    qualityGrade: {
      type: String,
      required: true,
    },
    ratePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['booked', 'arrived', 'verified', 'weighed', 'procured', 'payment_initiated', 'paid', 'rejected'],
      default: 'booked',
    },
    verifiedAt: { type: Date },
    weighedAt: { type: Date },
    procuredAt: { type: Date },
    paymentInitiatedAt: { type: Date },
    rejectedAt: { type: Date },
    verificationNotes: { type: String },
    weighingDetails: {
      netWeight: { type: Number, min: 0 },
      tareWeight: { type: Number, min: 0 },
      grade: { type: String },
    },
    procurementNotes: { type: String },
  },
  { timestamps: true }
);

procurementSchema.index({ farmer: 1, status: 1 });
procurementSchema.index({ centre: 1, createdAt: -1 });

module.exports = mongoose.model('Procurement', procurementSchema);
