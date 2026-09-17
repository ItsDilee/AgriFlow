const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Procurement = require('../models/Procurement');
const Farmer = require('../models/Farmer');
const { protect, adminOnly } = require('../middleware/auth');

const STATUS_MAP = {
  pending: 'Pending',
  processing: 'Payment Initiated',
  successful: 'Paid',
  failed: 'Failed',
};

const STATUS_COLOR = {
  pending: '#92400e',
  processing: '#db2777',
  successful: '#15803d',
  failed: '#b91c1c',
};

// Helper to get farmer profile
const getFarmerProfile = async (userId) => {
  return await Farmer.findOne({ user: userId });
};

// ------------------------------------------------------------------
// GET /api/payments  (admin — with filters)
// ------------------------------------------------------------------
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, method, farmerId, procurementId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (farmerId) filter.farmer = farmerId;
    if (procurementId) filter.procurement = procurementId;

    const payments = await Payment.find(filter)
      .populate('procurement', 'commodity status')
      .populate('farmer', 'user farmName')
      .sort({ createdAt: -1 });

    res.json({ payments, count: payments.length });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// GET /api/payments/:id  (admin or owning farmer)
// ------------------------------------------------------------------
router.get('/:id', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('procurement', 'commodity status centre')
      .populate('farmer', 'user farmName');
    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    if (req.user.role === 'farmer') {
      const farmer = await getFarmerProfile(req.user.id);
      if (!farmer || payment.farmer.toString() !== farmer._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
      }
    }
    res.json({ payment });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// GET /api/payments/my  (farmer — their payments)
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
    const payments = await Payment.find({ farmer: farmer._id })
      .populate('procurement', 'commodity status')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/payments/:id/status  (admin — update status + reference)
// ------------------------------------------------------------------
router.patch('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, transactionId, method, amount } = req.body || {};
    const allowedStatuses = ['pending', 'processing', 'successful', 'failed'];

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    // Validate status if provided
    if (status && !allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    if (status) payment.status = status;
    if (transactionId !== undefined) payment.transactionId = transactionId;
    if (method) payment.method = method;
    if (amount !== undefined) payment.amount = amount;

    if (status === 'successful' && !payment.paidAt) payment.paidAt = new Date();
    if (status === 'failed' && !payment.paidAt) payment.paidAt = null;

    await payment.save();

    // Sync procurement if needed
    if (status === 'successful') {
      await Procurement.findByIdAndUpdate(payment.procurement, { status: 'paid' }, { new: true });
      // Notify farmer of completed payment
      const Farmer = require('../models/Farmer');
      const Notification = require('../models/Notification');
      const farmerDoc = await Farmer.findById(payment.farmer);
      if (farmerDoc && farmerDoc.user) {
        await Notification.create({
          user: farmerDoc.user,
          title: 'Payment Completed',
          message: `Your payment of ₹${payment.amount} is completed (Ref: ${payment.transactionId || '—'}).`,
          type: 'payment',
          isRead: false,
        });
      }
    }

    res.json({ message: 'Payment updated', payment });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// POST /api/payments  (admin — create standalone / linked payment record)
// ------------------------------------------------------------------
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { procurementId, farmerId, amount, method, transactionId, status = 'pending' } = req.body;
    if (!procurementId || !farmerId || amount === undefined) {
      res.status(400);
      throw new Error('procurementId, farmerId, amount required');
    }
    const procurement = await Procurement.findById(procurementId);
    if (!procurement) {
      res.status(404);
      throw new Error('Procurement not found');
    }
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer not found');
    }

    const payment = await Payment.create({
      procurement: procurementId,
      farmer: farmerId,
      amount,
      method: method || 'bank_transfer',
      transactionId: transactionId || `TXN-${Date.now()}`,
      status,
      paidAt: status === 'successful' ? new Date() : null,
    });

    res.status(201).json({ message: 'Payment record created', payment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
