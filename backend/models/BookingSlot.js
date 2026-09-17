const mongoose = require('mongoose');

const bookingSlotSchema = new mongoose.Schema(
  {
    centre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Centre',
      required: true,
    },
    date: {
      type: String, // format: 'YYYY-MM-DD'
      required: true,
    },
    timeSlot: {
      type: String, // format: 'HH:MM-HH:MM'
      required: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound index for unique and fast lookup
bookingSlotSchema.index({ centre: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('BookingSlot', bookingSlotSchema);
