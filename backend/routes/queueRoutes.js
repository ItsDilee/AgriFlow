const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Farmer = require('../models/Farmer');
const Centre = require('../models/Centre');
const DailyCounter = require('../models/DailyCounter');
const { protect, adminOnly } = require('../middleware/auth');
const { broadcastQueue, computeStats } = require('../utils/queueHelpers');

// Helper: today's date range
const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const todayStr = () => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// POST /api/queue/checkin
// Farmer checks in for their scheduled appointment today
// ---------------------------------------------------------------------------
router.post('/checkin', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Only farmers can check in');
    }

    const { appointmentId } = req.body;
    if (!appointmentId) {
      res.status(400);
      throw new Error('appointmentId is required');
    }

    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    // Ownership check
    if (appointment.farmer.toString() !== farmer._id.toString()) {
      res.status(403);
      throw new Error('Not your appointment');
    }

    if (appointment.status !== 'scheduled') {
      res.status(400);
      throw new Error(`Cannot check in — appointment status is: ${appointment.status}`);
    }

    // Verify it is today
    const apptDate = new Date(appointment.scheduledDate).toISOString().split('T')[0];
    if (apptDate !== todayStr()) {
      res.status(400);
      throw new Error('You can only check in on the day of your appointment');
    }

    // Prevent duplicate queue entry
    const existing = await Queue.findOne({ appointment: appointmentId });
    if (existing) {
      return res.json({ message: 'Already checked in', queueEntry: existing });
    }

    // Atomically get next token number for this centre today
    const counter = await DailyCounter.findOneAndUpdate(
      { centre: appointment.centre, date: todayStr() },
      { $inc: { tokenCounter: 1 } },
      { upsert: true, new: true }
    );

    // Create queue entry
    const queueEntry = await Queue.create({
      centre: appointment.centre,
      appointment: appointmentId,
      farmer: farmer._id,
      tokenNumber: counter.tokenCounter,
      status: 'waiting',
      joinedAt: new Date(),
    });

    // Update appointment status
    appointment.status = 'arrived';
    await appointment.save();

    // Notify farmer of check-in
    const Notification = require('../models/Notification');
    await Notification.create({
      user: req.user.id,
      title: 'Checked In',
      message: `You are checked in at ${appointment.centre?.name || 'centre'}. Token #${counter.tokenCounter}.`,
      type: 'queue',
      isRead: false,
    });

    // Broadcast
    const io = req.app.get('io');
    await broadcastQueue(io, appointment.centre.toString());

    res.status(201).json({ message: 'Checked in successfully', queueEntry });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/queue/:centreId
// Get today's full queue for a centre
// ---------------------------------------------------------------------------
router.get('/:centreId', protect, async (req, res, next) => {
  try {
    const { centreId } = req.params;
    const centre = await Centre.findById(centreId);
    if (!centre) {
      res.status(404);
      throw new Error('Centre not found');
    }

    const { start, end } = todayRange();

    const queue = await Queue.find({
      centre: centreId,
      createdAt: { $gte: start, $lt: end },
    })
      .populate({ path: 'farmer', populate: { path: 'user', select: 'name' } })
      .populate('appointment', 'commodity estimatedQuantity timeSlot tokenNumber')
      .sort({ tokenNumber: 1 });

    const stats = computeStats(queue, centre);

    res.json({ centreId, date: todayStr(), queue, stats });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/queue/:centreId/my
// Farmer views their own queue position + estimated wait
// ---------------------------------------------------------------------------
router.get('/:centreId/my', protect, async (req, res, next) => {
  try {
    const { centreId } = req.params;

    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }

    const centre = await Centre.findById(centreId);
    if (!centre) {
      res.status(404);
      throw new Error('Centre not found');
    }

    const { start, end } = todayRange();

    const allQueue = await Queue.find({
      centre: centreId,
      createdAt: { $gte: start, $lt: end },
    })
      .populate('appointment', 'commodity estimatedQuantity timeSlot tokenNumber')
      .sort({ tokenNumber: 1 });

    const myEntry = allQueue.find(
      (e) => e.farmer.toString() === farmer._id.toString()
    );

    const stats = computeStats(allQueue, centre);

    if (!myEntry) {
      return res.json({ myEntry: null, position: null, estimatedWaitMs: null, stats });
    }

    // Position = number of 'waiting' entries with tokenNumber < mine
    const position = allQueue.filter(
      (e) => e.status === 'waiting' && e.tokenNumber < myEntry.tokenNumber
    ).length + (myEntry.status === 'waiting' ? 1 : 0);

    const waitingAhead = allQueue.filter(
      (e) => e.status === 'waiting' && e.tokenNumber < myEntry.tokenNumber
    ).length;

    const batchesAhead = Math.ceil(waitingAhead / centre.numberOfCounters);
    const estimatedWaitMs = batchesAhead * stats.avgProcessingMs;

    res.json({ myEntry, position, estimatedWaitMs, stats });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/queue/:entryId/call-next  (admin)
// Move a waiting entry to in-progress — respects counter capacity
// ---------------------------------------------------------------------------
router.patch('/:entryId/call-next', protect, adminOnly, async (req, res, next) => {
  try {
    const entry = await Queue.findById(req.params.entryId);
    if (!entry || entry.status !== 'waiting') {
      res.status(400);
      throw new Error('Entry not found or not in waiting status');
    }

    const centre = await Centre.findById(entry.centre);
    const maxCounters = centre.numberOfCounters || 1;

    const { start, end } = todayRange();
    const inProgressCount = await Queue.countDocuments({
      centre: entry.centre,
      status: 'in-progress',
      createdAt: { $gte: start, $lt: end },
    });

    if (inProgressCount >= maxCounters) {
      res.status(400);
      throw new Error(
        `All ${maxCounters} counter(s) are busy. Complete a serving entry first.`
      );
    }

    entry.status = 'in-progress';
    entry.expectedTime = new Date();
    await entry.save();

    const io = req.app.get('io');
    await broadcastQueue(io, entry.centre.toString());

    // Notify farmer being served
    const Notification = require('../models/Notification');
    await Notification.create({
      user: entry.farmer.user ? entry.farmer.user : (await require('../models/Farmer').findById(entry.farmer)).user,
      title: 'Your Turn',
      message: `Your token #${entry.tokenNumber} is being served now.`,
      type: 'queue',
      isRead: false,
    });
    // Also notify admin
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const a of admins) {
      await Notification.create({
        user: a._id,
        title: 'Queue Update',
        message: `Farmer token #${entry.tokenNumber} is now being served.`,
        type: 'queue',
        isRead: false,
      });
    }

    res.json({ message: 'Farmer called to counter', queueEntry: entry });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/queue/:entryId/complete  (admin)
// Mark entry completed, update appointment
// ---------------------------------------------------------------------------
router.patch('/:entryId/complete', protect, adminOnly, async (req, res, next) => {
  try {
    const entry = await Queue.findById(req.params.entryId);
    if (!entry || entry.status !== 'in-progress') {
      res.status(400);
      throw new Error('Entry not found or not currently being served');
    }

    entry.status = 'completed';
    entry.completedAt = new Date();
    await entry.save();

    await Appointment.findByIdAndUpdate(entry.appointment, { status: 'completed' });

    const io = req.app.get('io');
    await broadcastQueue(io, entry.centre.toString());

    // Notify farmer of completion
    const Notification = require('../models/Notification');
    const Farmer = require('../models/Farmer');
    const farmerDoc = await Farmer.findById(entry.farmer);
    if (farmerDoc && farmerDoc.user) {
      await Notification.create({
        user: farmerDoc.user,
        title: 'Visit Completed',
        message: `Your visit (token #${entry.tokenNumber}) is completed. Thank you.`,
        type: 'queue',
        isRead: false,
      });
    }

    res.json({ message: 'Serving completed', queueEntry: entry });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/queue/:entryId/no-show  (admin)
// Mark entry as skipped, update appointment
// ---------------------------------------------------------------------------
router.patch('/:entryId/no-show', protect, adminOnly, async (req, res, next) => {
  try {
    const entry = await Queue.findById(req.params.entryId);
    if (!entry || !['waiting', 'in-progress'].includes(entry.status)) {
      res.status(400);
      throw new Error('Entry cannot be marked as no-show in its current state');
    }

    entry.status = 'skipped';
    entry.completedAt = new Date();
    await entry.save();

    await Appointment.findByIdAndUpdate(entry.appointment, { status: 'no-show' });

    const io = req.app.get('io');
    await broadcastQueue(io, entry.centre.toString());

    res.json({ message: 'Marked as no-show', queueEntry: entry });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
