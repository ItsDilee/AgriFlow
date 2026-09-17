const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc  Health check for auth service
// @route GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({ message: 'Auth service running' });
});

// @desc  Register a new user
// @route POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with that email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'farmer',
    });

    // Auto-create a Farmer profile for farmer registrations
    if (user.role === 'farmer') {
      await Farmer.create({ user: user._id });
    }

    res.status(201).json({
      message: 'Account created successfully',
      userId: user._id,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Login user
// @route POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Get current user's profile
// @route GET /api/auth/me
// @access Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = await Farmer.findOne({ user: user._id });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      farmerProfile,
    });
  } catch (err) {
    next(err);
  }
});

// @desc  Update current user's account details or password
// @route PUT /api/auth/me
// @access Private
router.put('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, currentPassword, newPassword } = req.body;

    if (name) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400);
        throw new Error('Please provide your current password to set a new one');
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
      }
      if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters');
      }
      user.password = newPassword; // pre-save hook will hash it
    }

    await user.save();

    res.json({
      message: 'Account updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
