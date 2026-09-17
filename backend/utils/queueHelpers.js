const Queue = require('../models/Queue');
const Centre = require('../models/Centre');

/**
 * Compute queue stats and estimated wait time from a list of queue entries.
 * @param {Array} queue   - All queue entries for the centre today (any status)
 * @param {Object} centre - The Centre document (has numberOfCounters, slotDurationMinutes)
 */
const computeStats = (queue, centre) => {
  const waiting = queue.filter((e) => e.status === 'waiting');
  const inProgress = queue.filter((e) => e.status === 'in-progress');
  const completed = queue.filter((e) => e.status === 'completed');
  const skipped = queue.filter((e) => e.status === 'skipped');

  // Average processing time from completed entries today
  let avgProcessingMs = (centre.slotDurationMinutes || 30) * 60 * 1000; // fallback
  const completedWithTime = completed.filter((e) => e.completedAt && e.joinedAt);
  if (completedWithTime.length > 0) {
    const totalMs = completedWithTime.reduce(
      (acc, e) => acc + (new Date(e.completedAt) - new Date(e.joinedAt)),
      0
    );
    avgProcessingMs = Math.round(totalMs / completedWithTime.length);
  }

  const numberOfCounters = centre.numberOfCounters || 1;

  // Estimated wait for the NEXT farmer to be called = batches of numberOfCounters
  const waitingBatches = Math.ceil(waiting.length / numberOfCounters);
  const estimatedWaitMs = waitingBatches * avgProcessingMs;

  return {
    total: queue.length,
    waiting: waiting.length,
    serving: inProgress.length,
    completed: completed.length,
    skipped: skipped.length,
    avgProcessingMs,
    estimatedWaitMs,
    numberOfCounters,
  };
};

/**
 * Fetch today's full queue for a centre and broadcast it to all connected clients.
 * @param {Object} io       - Socket.IO server instance
 * @param {string} centreId - Centre ObjectId string
 */
const broadcastQueue = async (io, centreId) => {
  try {
    const centre = await Centre.findById(centreId);
    if (!centre) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Queue.find({
      centre: centreId,
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .populate({ path: 'farmer', populate: { path: 'user', select: 'name' } })
      .populate('appointment', 'commodity estimatedQuantity timeSlot tokenNumber')
      .sort({ tokenNumber: 1 });

    const stats = computeStats(queue, centre);
    const serving = queue.filter((e) => e.status === 'in-progress');

    io.to(`centre:${centreId}`).emit('queue:update', {
      centreId,
      queue,
      serving,
      stats,
    });
  } catch (err) {
    console.error('[broadcastQueue] error:', err.message);
  }
};

module.exports = { broadcastQueue, computeStats };
