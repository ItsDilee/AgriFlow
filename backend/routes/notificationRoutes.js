const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// ------------------------------------------------------------------
// GET /api/notifications  (my notifications — unread first)
// ------------------------------------------------------------------
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/notifications/:id/read  (mark single read)
// ------------------------------------------------------------------
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!n) {
      res.status(404);
      throw new Error('Notification not found');
    }
    n.isRead = true;
    await n.save();
    res.json({ message: 'Marked as read', notification: n });

    // Broadcast update to user's socket room
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user.id}`).emit('notification:update', { userId: req.user.id, unreadCount: await Notification.countDocuments({ user: req.user.id, isRead: false }) });
    }
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// PATCH /api/notifications/read-all  (mark all my unread as read)
// ------------------------------------------------------------------
router.patch('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user.id}`).emit('notification:update', { userId: req.user.id, unreadCount: 0 });
    }
  } catch (err) {
    next(err);
  }
});

// ------------------------------------------------------------------
// POST /api/notifications  (admin / system — create for a user)
// ------------------------------------------------------------------
router.post('/', protect, async (req, res, next) => {
  try {
    // Only admins can create notifications for others; farmers can only create for themselves (if needed)
    const { userId, title, message, type = 'system' } = req.body;
    const targetUserId = (req.user.role === 'admin' && userId) ? userId : req.user.id;
    const notification = await Notification.create({
      user: targetUserId,
      title,
      message,
      type,
      isRead: false,
    });
    res.status(201).json({ message: 'Notification created', notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
