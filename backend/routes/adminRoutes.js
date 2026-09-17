const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// @desc  List all users (with pagination)
// @route GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password');

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Toggle a user's isActive status
// @route PATCH /api/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent self-deactivation
    if (user._id.toString() === req.user.id) {
      res.status(400);
      throw new Error('You cannot deactivate your own account');
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { id: user._id, name: user.name, email: user.email, isActive: user.isActive },
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Toggle a farmer's isVerified status
// @route PATCH /api/admin/farmers/:id/verify
router.patch('/farmers/:id/verify', async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate('user', 'name email');
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer not found');
    }

    farmer.isVerified = !farmer.isVerified;
    await farmer.save();

    res.json({
      message: `Farmer ${farmer.isVerified ? 'verified' : 'unverified'} successfully`,
      farmer: {
        id: farmer._id,
        farmName: farmer.farmName,
        isVerified: farmer.isVerified,
        user: farmer.user,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
