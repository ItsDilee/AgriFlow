const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
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
    scheduledDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String, // e.g., '09:00-11:00'
      required: true,
    },
    commodity: {
      type: String,
      required: true,
    },
    estimatedQuantity: {
      type: Number, // in kg
      required: true,
      min: [1, 'Quantity must be greater than 0'],
    },
    tokenNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'arrived', 'cancelled', 'no-show', 'completed'],
      default: 'scheduled',
    },
    cancelReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound indexes for scaling specific query patterns
appointmentSchema.index({ centre: 1, scheduledDate: 1 }); // Useful for capacity checking at a centre on a given date
appointmentSchema.index({ farmer: 1, scheduledDate: 1 }); // Prevents overloading or verifying single-book logic per farmer
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
