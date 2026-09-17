const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Centre name is required'],
      trim: true,
    },
    location: {
      address: { type: String, required: true },
      district: { type: String, required: true, index: true },
      state: { type: String, required: true },
    },
    capacityPerDay: {
      type: Number,
      required: true,
      default: 50,
      min: [1, 'Capacity must be at least 1'],
    },
    activeCommodities: {
      type: [String],
      default: [],
    },
    contactInfo: {
      phone: { type: String },
      email: { type: String },
    },
    operatingHours: {
      open:  { type: String, default: '08:00' },
      close: { type: String, default: '17:00' },
    },
    numberOfCounters: {
      type: Number,
      default: 2,
      min: [1, 'At least one counter is required'],
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Slot duration must be at least 5 minutes'],
    },
    slotCapacity: {
      type: Number,
      default: 5,
      min: [1, 'Slot capacity must be at least 1'],
      comment: 'Number of farmers that can be booked per slot',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for quick lookup of active centres by district
centreSchema.index({ 'location.district': 1, isActive: 1 });

module.exports = mongoose.model('Centre', centreSchema);
