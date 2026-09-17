const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Centre = require('../models/Centre');
const Farmer = require('../models/Farmer');
const BookingSlot = require('../models/BookingSlot');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// Helper to generate timeslots
const generateTimeSlots = (openTime, closeTime, durationMinutes) => {
  const slots = [];
  let [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const startH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
    const startM = (currentMinutes % 60).toString().padStart(2, '0');
    const endH = Math.floor((currentMinutes + durationMinutes) / 60).toString().padStart(2, '0');
    const endM = ((currentMinutes + durationMinutes) % 60).toString().padStart(2, '0');

    slots.push(`${startH}:${startM}-${endH}:${endM}`);
    currentMinutes += durationMinutes;
  }
  return slots;
};

// @desc  Get available time slots for a specific centre and date
// @route GET /api/appointments/slots?centreId=&date=YYYY-MM-DD
// @access Private
router.get('/slots', protect, async (req, res, next) => {
  try {
    const { centreId, date } = req.query;

    if (!centreId || !date) {
      res.status(400);
      throw new Error('Please provide centreId and date');
    }

    const centre = await Centre.findById(centreId);
    if (!centre || !centre.isActive) {
      res.status(404);
      throw new Error('Active Centre not found');
    }

    const allSlots = generateTimeSlots(
      centre.operatingHours.open,
      centre.operatingHours.close,
      centre.slotDurationMinutes
    );

    const maxCapacityPerSlot = centre.numberOfCounters * centre.slotCapacity;

    // Fetch current bookings for this centre on this date
    const bookingSlots = await BookingSlot.find({ centre: centreId, date });
    const bookingMap = {};
    bookingSlots.forEach(bs => {
      bookingMap[bs.timeSlot] = bs.bookedCount;
    });

    const availability = allSlots.map(slot => {
      const booked = bookingMap[slot] || 0;
      return {
        timeSlot: slot,
        maxCapacity: maxCapacityPerSlot,
        bookedCount: booked,
        remainingCapacity: maxCapacityPerSlot - booked,
        isAvailable: booked < maxCapacityPerSlot,
      };
    });

    res.json({ date, centreId, slots: availability });
  } catch (err) {
    next(err);
  }
});

// @desc  Book an appointment
// @route POST /api/appointments
// @access Private (Farmer only)
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'farmer') {
      res.status(403);
      throw new Error('Only farmers can book appointments');
    }

    const { centreId, date, timeSlot, commodity, estimatedQuantity } = req.body;

    if (!centreId || !date || !timeSlot || !commodity || !estimatedQuantity) {
      res.status(400);
      throw new Error('Missing required booking fields');
    }

    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }

    const centre = await Centre.findById(centreId);
    if (!centre || !centre.isActive) {
      res.status(404);
      throw new Error('Active centre not found');
    }

    // Verify commodity is supported
    if (!centre.activeCommodities.includes(commodity)) {
      res.status(400);
      throw new Error(`Commodity ${commodity} is not accepted at this centre`);
    }

    const maxCapacityPerSlot = centre.numberOfCounters * centre.slotCapacity;

    // 1. Initialize slot inventory if not exists (Upsert)
    await BookingSlot.updateOne(
      { centre: centreId, date, timeSlot },
      { $setOnInsert: { maxCapacity: maxCapacityPerSlot, bookedCount: 0 } },
      { upsert: true }
    );

    // 2. Concurrency-safe atomic increment
    const updatedSlot = await BookingSlot.findOneAndUpdate(
      {
        centre: centreId,
        date,
        timeSlot,
        bookedCount: { $lt: maxCapacityPerSlot } // Only if capacity available
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!updatedSlot) {
      res.status(400);
      throw new Error('This time slot is fully booked. Please select another slot.');
    }

    try {
      // 3. Create Appointment
      const appointment = await Appointment.create({
        farmer: farmer._id,
        centre: centreId,
        scheduledDate: date,
        timeSlot,
        commodity,
        estimatedQuantity,
        tokenNumber: generateToken(date),
        status: 'scheduled',
      });

      res.status(201).json({
        message: 'Appointment booked successfully',
        appointment: await appointment.populate('centre', 'name location'),
      });

      // Notify farmer of booking
      const Notification = require('../models/Notification');
      await Notification.create({
        user: req.user.id,
        title: 'Appointment Booked',
        message: `Your appointment for ${commodity} at ${timeSlot} is confirmed.`,
        type: 'appointment',
        isRead: false,
      });

      // Notify admin of new booking
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const adminUser of admins) {
        await Notification.create({
          user: adminUser._id,
          title: 'New Appointment',
          message: `Farmer booked ${commodity} for ${date} at ${timeSlot}.`,
          type: 'appointment',
          isRead: false,
        });
      }
    } catch (createErr) {
      // Rollback on failure
      await BookingSlot.updateOne(
        { _id: updatedSlot._id },
        { $inc: { bookedCount: -1 } }
      );
      throw createErr;
    }
  } catch (err) {
    next(err);
  }
});

// @desc  Get my appointments
// @route GET /api/appointments/my
// @access Private (Farmer only)
router.get('/my', protect, async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user.id });
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer profile not found');
    }

    const appointments = await Appointment.find({ farmer: farmer._id })
      .populate('centre', 'name location contactInfo')
      .sort({ scheduledDate: -1, createdAt: -1 });

    res.json({ appointments });
  } catch (err) {
    next(err);
  }
});

// @desc  Get appointment details
// @route GET /api/appointments/:id
// @access Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('centre')
      .populate('farmer');

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    // Ensure ownership if a farmer is requesting
    if (req.user.role === 'farmer') {
      const myFarmerProfile = await Farmer.findOne({ user: req.user.id });
      if (appointment.farmer._id.toString() !== myFarmerProfile._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this appointment');
      }
    }

    res.json({ appointment });
  } catch (err) {
    next(err);
  }
});

// @desc  Cancel appointment
// @route PATCH /api/appointments/:id/cancel
// @access Private
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      res.status(400);
      throw new Error('Appointment is already cancelled');
    }
    if (appointment.status !== 'scheduled') {
      res.status(400);
      throw new Error(`Cannot cancel appointment with status: ${appointment.status}`);
    }

    // Authorization
    if (req.user.role === 'farmer') {
      const myFarmerProfile = await Farmer.findOne({ user: req.user.id });
      if (appointment.farmer.toString() !== myFarmerProfile._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to cancel this appointment');
      }
    }

    const { cancelReason } = req.body;

    appointment.status = 'cancelled';
    appointment.cancelReason = cancelReason || 'Cancelled by user';
    await appointment.save();

    // Release capacity using ISO date portion of Date
    const isoDateString = new Date(appointment.scheduledDate).toISOString().split('T')[0];
    await BookingSlot.updateOne(
      {
        centre: appointment.centre,
        date: isoDateString,
        timeSlot: appointment.timeSlot
      },
      { $inc: { bookedCount: -1 } }
    );

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (err) {
    next(err);
  }
});

// @desc  Reschedule appointment
// @route PATCH /api/appointments/:id/reschedule
// @access Private
router.patch('/:id/reschedule', protect, async (req, res, next) => {
  try {
    const { newDate, newTimeSlot } = req.body;

    if (!newDate || !newTimeSlot) {
      res.status(400);
      throw new Error('Please provide newDate and newTimeSlot');
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment || appointment.status !== 'scheduled') {
      res.status(404);
      throw new Error('Only scheduled appointments can be rescheduled');
    }

    if (req.user.role === 'farmer') {
      const myFarmerProfile = await Farmer.findOne({ user: req.user.id });
      if (appointment.farmer.toString() !== myFarmerProfile._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
      }
    }

    const centre = await Centre.findById(appointment.centre);
    const maxCapacityPerSlot = centre.numberOfCounters * centre.slotCapacity;

    // 1. Initialize slot inventory if not exists (Upsert)
    await BookingSlot.updateOne(
      { centre: centre._id, date: newDate, timeSlot: newTimeSlot },
      { $setOnInsert: { maxCapacity: maxCapacityPerSlot, bookedCount: 0 } },
      { upsert: true }
    );

    // 2. Concurrency-safe atomic increment for NEW slot
    const updatedSlot = await BookingSlot.findOneAndUpdate(
      {
        centre: centre._id,
        date: newDate,
        timeSlot: newTimeSlot,
        bookedCount: { $lt: maxCapacityPerSlot } // Only if capacity available
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!updatedSlot) {
      res.status(400);
      throw new Error('The requested time slot is fully booked');
    }

    // 3. Decrement OLD slot
    const oldIsoDateString = new Date(appointment.scheduledDate).toISOString().split('T')[0];
    await BookingSlot.updateOne(
      { centre: centre._id, date: oldIsoDateString, timeSlot: appointment.timeSlot },
      { $inc: { bookedCount: -1 } }
    );

    // 4. Update appointment
    appointment.scheduledDate = newDate;
    appointment.timeSlot = newTimeSlot;
    // Generate new token for clarity on rescheduled
    appointment.tokenNumber = generateToken(newDate);

    await appointment.save();

    res.json({ message: 'Appointment rescheduled successfully', appointment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
