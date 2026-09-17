const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');
const { protect, adminOnly } = require('../middleware/auth');

// @desc  Get current farmer's own profile
// @route GET /api/farmers/me
// @access Private (farmer)
router.get('/me', protect, async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user.id }).populate(
      'user',
      'name email role isActive'
    );
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }
    res.json(farmer);
  } catch (err) {
    next(err);
  }
});

// @desc  Update current farmer's own profile
// @route PUT /api/farmers/me
// @access Private (farmer)
router.put('/me', protect, async (req, res, next) => {
  try {
    const { farmName, location, cropTypes, contactPhone, bankDetails } = req.body;

    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }

    if (farmName !== undefined) farmer.farmName = farmName;
    if (location !== undefined) farmer.location = location;
    if (cropTypes !== undefined) {
      // Accept either an array or a comma-separated string
      farmer.cropTypes = Array.isArray(cropTypes)
        ? cropTypes
        : cropTypes.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (contactPhone !== undefined) farmer.contactPhone = contactPhone;
    if (bankDetails) {
      farmer.bankDetails = { ...farmer.bankDetails.toObject?.() ?? farmer.bankDetails, ...bankDetails };
    }

    await farmer.save();
    res.json({ message: 'Profile updated successfully', farmer });
  } catch (err) {
    next(err);
  }
});

// @desc  List all farmers (admin only)
// @route GET /api/farmers
// @access Private (admin)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const farmers = await Farmer.find().populate('user', 'name email role isActive');
    res.json({ count: farmers.length, farmers });
  } catch (err) {
    next(err);
  }
});

// @desc  Get a single farmer by ID (admin only)
// @route GET /api/farmers/:id
// @access Private (admin)
router.get('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate(
      'user',
      'name email role isActive'
    );
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer not found');
    }
    res.json(farmer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
