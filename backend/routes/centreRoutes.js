const express = require('express');
const router = express.Router();
const Centre = require('../models/Centre');
const { protect, adminOnly } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Public / farmer routes
// ---------------------------------------------------------------------------

// @desc  List centres
//        - Authenticated admins see all (including inactive)
//        - Everyone else sees only active centres
//        Supports ?district= filter
// @route GET /api/centres
// @access Public (active only) / Admin (all)
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};

    // Admins can see all centres; everyone else sees active only
    if (req.user.role !== 'admin') {
      filter.isActive = true;
    }

    // Optional district filter
    if (req.query.district) {
      filter['location.district'] = new RegExp(req.query.district, 'i');
    }

    const centres = await Centre.find(filter).sort({ createdAt: -1 });
    res.json({ count: centres.length, centres });
  } catch (err) {
    next(err);
  }
});

// @desc  Get a single centre by ID
// @route GET /api/centres/:id
// @access Private (any authenticated user)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const centre = await Centre.findById(req.params.id);
    if (!centre) {
      res.status(404);
      throw new Error('Centre not found');
    }
    // Non-admin users can only fetch active centres
    if (req.user.role !== 'admin' && !centre.isActive) {
      res.status(404);
      throw new Error('Centre not found');
    }
    res.json({ centre });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Admin-only routes
// ---------------------------------------------------------------------------

// @desc  Create a new procurement centre
// @route POST /api/centres
// @access Private (admin)
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const {
      name,
      location,
      capacityPerDay,
      activeCommodities,
      contactInfo,
      operatingHours,
      numberOfCounters,
      slotDurationMinutes,
      slotCapacity,
    } = req.body;

    if (!name || !location?.address || !location?.district || !location?.state) {
      res.status(400);
      throw new Error('Name, address, district, and state are required');
    }

    const centre = await Centre.create({
      name,
      location,
      capacityPerDay,
      activeCommodities,
      contactInfo,
      operatingHours,
      numberOfCounters,
      slotDurationMinutes,
      slotCapacity,
    });

    res.status(201).json({ message: 'Centre created successfully', centre });
  } catch (err) {
    next(err);
  }
});

// @desc  Update a procurement centre
// @route PUT /api/centres/:id
// @access Private (admin)
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const centre = await Centre.findById(req.params.id);
    if (!centre) {
      res.status(404);
      throw new Error('Centre not found');
    }

    const {
      name,
      location,
      capacityPerDay,
      activeCommodities,
      contactInfo,
      operatingHours,
      numberOfCounters,
      slotDurationMinutes,
      slotCapacity,
    } = req.body;

    if (name !== undefined) centre.name = name;
    if (location !== undefined) {
      centre.location = { ...centre.location.toObject?.() ?? centre.location, ...location };
    }
    if (capacityPerDay !== undefined) centre.capacityPerDay = capacityPerDay;
    if (activeCommodities !== undefined) {
      centre.activeCommodities = Array.isArray(activeCommodities)
        ? activeCommodities
        : activeCommodities.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (contactInfo !== undefined) {
      centre.contactInfo = { ...centre.contactInfo.toObject?.() ?? centre.contactInfo, ...contactInfo };
    }
    if (operatingHours !== undefined) {
      centre.operatingHours = { ...centre.operatingHours.toObject?.() ?? centre.operatingHours, ...operatingHours };
    }
    if (numberOfCounters !== undefined) centre.numberOfCounters = numberOfCounters;
    if (slotDurationMinutes !== undefined) centre.slotDurationMinutes = slotDurationMinutes;
    if (slotCapacity !== undefined) centre.slotCapacity = slotCapacity;

    await centre.save();
    res.json({ message: 'Centre updated successfully', centre });
  } catch (err) {
    next(err);
  }
});

// @desc  Toggle a centre's isActive status
// @route PATCH /api/centres/:id/toggle-active
// @access Private (admin)
router.patch('/:id/toggle-active', protect, adminOnly, async (req, res, next) => {
  try {
    const centre = await Centre.findById(req.params.id);
    if (!centre) {
      res.status(404);
      throw new Error('Centre not found');
    }

    centre.isActive = !centre.isActive;
    await centre.save();

    res.json({
      message: `Centre ${centre.isActive ? 'activated' : 'deactivated'} successfully`,
      centre,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
