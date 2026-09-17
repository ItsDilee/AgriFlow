const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    farmName: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    cropTypes: {
      type: [String],
      default: [],
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    bankDetails: {
      accountNumber: { type: String, trim: true, default: '' },
      ifscCode: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farmer', farmerSchema);
