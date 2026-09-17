const mongoose = require('mongoose');

const dailyCounterSchema = new mongoose.Schema(
  {
    centre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Centre',
      required: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    tokenCounter: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Unique per centre per day
dailyCounterSchema.index({ centre: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCounter', dailyCounterSchema);
