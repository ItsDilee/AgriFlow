const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API status — reports server + DB health
app.get('/api/status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'ok',
    db: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/centres', require('./routes/centreRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/procurements', require('./routes/procurementRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins a centre room to receive live queue updates
  socket.on('join:centre', ({ centreId }) => {
    if (centreId) socket.join(`centre:${centreId}`);
  });

  socket.on('leave:centre', ({ centreId }) => {
    if (centreId) socket.leave(`centre:${centreId}`);
  });

  socket.on('join:user', ({ userId }) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('leave:user', ({ userId }) => {
    if (userId) socket.leave(`user:${userId}`);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
