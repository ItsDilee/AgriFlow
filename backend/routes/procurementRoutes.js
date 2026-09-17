const express = require('express');
const router = express.Router();
const Procurement = require('../models/Procurement');
const Payment = require('../models/Payment');
const Farmer = require('../models/Farmer');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const { protect, adminOnly } = require('../middleware/auth');

const ALLOWED_TRANSITIONS = {
  booked: ['arrived'],
  arrived: ['verified', 'rejected'],
  verified: ['weighed', 'rejected'],
  weighed: ['procured', 'rejected'],
  procured: ['payment_initiated', 'rejected'],
  payment_initiated: ['paid', 'rejected'],
  paid: [],
  rejected: [],
};

const validateTransition = (current, next) => {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
};

// Helper to get farmer profile
const getFarmerProfile = async (userId) => {
  return await Farmer.findOne({ user: userId });
};

// ------------------------------------------------------------------
// GET /api/procurements/my  (farmer)
// ------------------------------------------------------------------
router.get('/my', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Access denied');
    }
    const farmer = await getFarmerProfile(req.user.id);
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }
    const records = await Procurement.find({ farmer: farmer._id })
      .populate('centre', 'name location')
      .populate('appointment', 'scheduledDate timeSlot')
      .sort({ createdAt: -1 });
    res.json({ procurements: records });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// GET /api/procurements/:id  (farmer or admin)
// ------------------------------------------------------------------
router.get('/:id', protect, async (req, res, next) => {
  try {
    const record = await Procurement.findById(req.params.id)
      .populate('farmer', 'user farmName')
      .populate('centre', 'name location')
      .populate('appointment', 'scheduledDate timeSlot commodity estimatedQuantity');
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }

    if (req.user.role === 'farmer') {
      const farmer = await getFarmerProfile(req.user.id);
      if (!farmer || record.farmer.toString() !== farmer._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
      }
    }
    res.json({ procurement: record });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// GET /api/procurements  (admin - list with optional filters)
// ------------------------------------------------------------------
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { centre, status, dateFrom, dateTo } = req.query;
    const filter = {};
    if (centre) filter.centre = centre;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const records = await Procurement.find(filter)
      .populate('farmer', 'user farmName')
      .populate('centre', 'name location')
      .populate('appointment', 'scheduledDate timeSlot')
      .sort({ createdAt: -1 });
    res.json({ procurements: records, count: records.length });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/procurements/:id/verify  (admin)
// ------------------------------------------------------------------
router.patch('/:id/verify', protect, adminOnly, async (req, res, next) => {
  try {
    const { notes } = req.body || {};
    const record = await Procurement.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }
    if (record.status !== 'arrived') {
      res.status(400);
      throw new Error(`Cannot verify — current status is: ${record.status}`);
    }
    record.status = 'verified';
    record.verifiedAt = new Date();
    if (notes) record.verificationNotes = notes;
    await record.save();

    // Notify farmer
    const Farmer = require('../models/Farmer');
    const Notification = require('../models/Notification');
    const farmerDoc = await Farmer.findById(record.farmer);
    if (farmerDoc && farmerDoc.user) {
      await Notification.create({
        user: farmerDoc.user,
        title: 'Procurement Verified',
        message: `Your ${record.commodity} procurement has been verified.`,
        type: 'payment',
        isRead: false,
      });
    }

    res.json({ message: 'Farmer verified', procurement: record });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/procurements/:id/weigh  (admin)
// ------------------------------------------------------------------
router.patch('/:id/weigh', protect, adminOnly, async (req, res, next) => {
  try {
    const { actualQuantity, qualityGrade, netWeight, tareWeight } = req.body;
    if (actualQuantity === undefined || !qualityGrade) {
      res.status(400);
      throw new Error('actualQuantity and qualityGrade required');
    }
    const record = await Procurement.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }
    if (record.status !== 'verified') {
      res.status(400);
      throw new Error(`Cannot weigh — current status is: ${record.status}`);
    }
    record.status = 'weighed';
    record.weighedAt = new Date();
    record.actualQuantity = actualQuantity;
    record.qualityGrade = qualityGrade;
    record.weighingDetails = {
      netWeight: netWeight || actualQuantity,
      tareWeight: tareWeight || 0,
      grade: qualityGrade,
    };
    await record.save();

    // Notify farmer of weighing
    const Farmer = require('../models/Farmer');
    const Notification = require('../models/Notification');
    const farmerDoc = await Farmer.findById(record.farmer);
    if (farmerDoc && farmerDoc.user) {
      await Notification.create({
        user: farmerDoc.user,
        title: 'Weighing Completed',
        message: `Your ${record.commodity} has been weighed (${record.actualQuantity} kg, grade ${record.qualityGrade}).`,
        type: 'payment',
        isRead: false,
      });
    }

    res.json({ message: 'Weighing recorded', procurement: record });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/procurements/:id/procure  (admin)
// ------------------------------------------------------------------
router.patch('/:id/procure', protect, adminOnly, async (req, res, next) => {
  try {
    const { ratePerKg, procurementNotes } = req.body;
    if (ratePerKg === undefined) {
      res.status(400);
      throw new Error('ratePerKg is required');
    }
    const record = await Procurement.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }
    if (record.status !== 'weighed') {
      res.status(400);
      throw new Error(`Cannot procure — current status is: ${record.status}`);
    }
    record.status = 'procured';
    record.procuredAt = new Date();
    record.ratePerKg = ratePerKg;
    record.totalAmount = Math.round(record.actualQuantity * ratePerKg);
    if (procurementNotes) record.procurementNotes = procurementNotes;
    await record.save();

    // Notify farmer of procurement
    const Farmer = require('../models/Farmer');
    const Notification = require('../models/Notification');
    const farmerDoc = await Farmer.findById(record.farmer);
    if (farmerDoc && farmerDoc.user) {
      await Notification.create({
        user: farmerDoc.user,
        title: 'Procurement Recorded',
        message: `Your ${record.commodity} procurement is recorded. Amount: ₹${record.totalAmount}.`,
        type: 'payment',
        isRead: false,
      });
    }

    res.json({ message: 'Procurement recorded', procurement: record });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/procurements/:id/payment-initiate  (admin)
// ------------------------------------------------------------------
router.patch('/:id/payment-initiate', protect, adminOnly, async (req, res, next) => {
  try {
    const { method = 'bank_transfer', transactionId } = req.body;
    const record = await Procurement.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }
    if (record.status !== 'procured') {
      res.status(400);
      throw new Error(`Cannot initiate payment — current status is: ${record.status}`);
    }
    record.status = 'payment_initiated';
    record.paymentInitiatedAt = new Date();
    await record.save();

    await Payment.create({
      procurement: record._id,
      farmer: record.farmer,
      amount: record.totalAmount,
      method,
      transactionId: transactionId || `TXN-${Date.now()}`,
      status: 'processing',
      paidAt: null,
    });

    // Notify farmer that payment is initiated
    const Notification = require('../models/Notification');
    const Farmer = require('../models/Farmer');
    const farmerDoc = await Farmer.findById(record.farmer);
    if (farmerDoc && farmerDoc.user) {
      await Notification.create({
        user: farmerDoc.user,
        title: 'Payment Initiated',
        message: `Payment of ₹${record.totalAmount} for ${record.commodity} has been initiated.`,
        type: 'payment',
        isRead: false,
      });
    }

    res.json({ message: 'Payment initiated', procurement: record });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/procurements/:id/payment-complete  (admin)
// ------------------------------------------------------------------
router.patch('/:id/payment-complete', protect, adminOnly, async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const record = await Procurement.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }
    if (record.status !== 'payment_initiated') {
      res.status(400);
      throw new Error(`Cannot complete payment — current status is: ${record.status}`);
    }
    record.status = 'paid';
    await record.save();

    // Notify farmer of payment completion
    const Notification = require('../models/Notification');
    const Farmer = require('../models/Farmer');
    const farmerDoc = await Farmer.findById(record.farmer);
    if (farmerDoc && farmerDoc.user) {
      await Notification.create({
        user: farmerDoc.user,
        title: 'Payment Completed',
        message: `Your ${record.commodity} payment of ₹${record.totalAmount} is completed.`,
        type: 'payment',
        isRead: false,
      });
    }

    const payment = await Payment.findOne({ procurement: record._id, status: 'processing' });
    if (payment) {
      payment.status = 'successful';
      payment.paidAt = new Date();
      if (transactionId) payment.transactionId = transactionId;
      await payment.save();
    }

    res.json({ message: 'Payment completed', procurement: record });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/procurements/:id/reject  (admin)
// ------------------------------------------------------------------
router.patch('/:id/reject', protect, adminOnly, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const record = await Procurement.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Procurement record not found');
    }
    const allowed = ['verified', 'weighed', 'procured', 'payment_initiated'];
    if (!allowed.includes(record.status)) {
      res.status(400);
      throw new Error(`Cannot reject — current status is: ${record.status}`);
    }
    record.status = 'rejected';
    record.rejectedAt = new Date();
    if (reason) record.procurementNotes = (record.procurementNotes || '') + ` | Rejected: ${reason}`;
    await record.save();
    res.json({ message: 'Procurement rejected', procurement: record });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
