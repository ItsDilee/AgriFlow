const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Procurement = require('../models/Procurement');
const Payment = require('../models/Payment');
const Centre = require('../models/Centre');
const User = require('../models/User');

// Helper to log audit events (called by other routes optionally)
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const log = await AuditLog.create(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (e) { next(e); }
});

// List audit logs with filters/search
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { action, targetModel, user, centre, from, to, search } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (targetModel) filter.targetModel = targetModel;
    if (user) filter.actor = user;
    if (centre) filter.centre = centre;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    let logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('actor', 'name email role')
      .populate('centre', 'name')
      .lean();

    if (search) {
      const re = new RegExp(search, 'i');
      logs = logs.filter(l =>
        (l.action && re.test(l.action)) ||
        (l.targetModel && re.test(l.targetModel)) ||
        (l.details && typeof l.details === 'object' && JSON.stringify(l.details).match(re)) ||
        (l.actor?.name && re.test(l.actor.name))
      );
    }

    res.json({ success: true, count: logs.length, data: logs });
  } catch (e) { next(e); }
});

// Operational reports endpoint
router.get('/reports/operational', protect, adminOnly, async (req, res, next) => {
  try {
    const centreCount = await Centre.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentSummary = await Appointment.aggregate([
      { $match: { scheduledDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const queueSummary = await Queue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const procurementSummary = await Procurement.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
    ]);

    const paymentSummary = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    const totalAuditLogs = await AuditLog.countDocuments();

    res.json({
      success: true,
      data: {
        overview: {
          centres: centreCount,
          auditLogs: totalAuditLogs,
          date: today.toISOString().split('T')[0],
        },
        appointments: appointmentSummary,
        queue: queueSummary,
        procurement: procurementSummary,
        payments: paymentSummary,
      },
    });
  } catch (e) { next(e); }
});

router.get('/reports/dashboard', protect, adminOnly, async (req, res, next) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const totalProcurements = await Procurement.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalQueues = await Queue.countDocuments();
    const totalUsers = await User.countDocuments();

    const topCentres = await Appointment.aggregate([
      { $group: { _id: '$centre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'centres', localField: '_id', foreignField: '_id', as: 'centreInfo' } },
      { $unwind: { path: '$centreInfo', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$centreInfo.name', count: 1, centreId: '$_id' } },
    ]);

    res.json({
      success: true,
      data: {
        totals: { appointments: totalAppointments, procurements: totalProcurements, payments: totalPayments, queues: totalQueues, users: totalUsers },
        topCentres,
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
