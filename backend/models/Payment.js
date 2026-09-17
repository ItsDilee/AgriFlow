const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    procurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement',
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'cash', 'upi'],
      required: true,
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'successful', 'failed'],
      default: 'processing',
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ farmer: 1, status: 1 });
paymentSchema.index({ procurement: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
