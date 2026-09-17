const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Farmer = require('./models/Farmer');
const Centre = require('./models/Centre');
const Appointment = require('./models/Appointment');
const BookingSlot = require('./models/BookingSlot');
const Queue = require('./models/Queue');
const DailyCounter = require('./models/DailyCounter');
const Procurement = require('./models/Procurement');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    console.log('Clearing database...');
    await AuditLog.deleteMany();
    await Notification.deleteMany();
    await Payment.deleteMany();
    await Procurement.deleteMany();
    await Queue.deleteMany();
    await DailyCounter.deleteMany();
    await Appointment.deleteMany();
    await BookingSlot.deleteMany();
    await Centre.deleteMany();
    await Farmer.deleteMany();
    await User.deleteMany();

    console.log('Seeding Users and Farmers...');

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@agriflow.com',
      password: 'Password123',
      role: 'admin',
    });

    const farmerUser1 = await User.create({
      name: 'Ramesh Kumar',
      email: 'ramesh@farm.com',
      password: 'Password123',
      role: 'farmer',
    });

    const farmerUser2 = await User.create({
      name: 'Suresh Patil',
      email: 'suresh@farm.com',
      password: 'Password123',
      role: 'farmer',
    });

    const farmerUser3 = await User.create({
      name: 'Anil Desai',
      email: 'anil@farm.com',
      password: 'Password123',
      role: 'farmer',
    });

    const farmerUser4 = await User.create({
      name: 'Priya Nair',
      email: 'priya@farm.com',
      password: 'Password123',
      role: 'farmer',
    });

    const farmer1 = await Farmer.create({
      user: farmerUser1._id,
      farmName: 'Ramesh Green Farms',
      location: 'Village Malegaon, Pune',
      cropTypes: ['Wheat', 'Soyabean'],
      contactPhone: '9876543210',
      isVerified: true,
      bankDetails: {
        accountNumber: '1122334455',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
      },
    });

    const farmer2 = await Farmer.create({
      user: farmerUser2._id,
      farmName: 'Sunrise Organics',
      location: 'Nashik',
      cropTypes: ['Onion', 'Grapes'],
      contactPhone: '9123456789',
      isVerified: true,
    });

    const farmer3 = await Farmer.create({
      user: farmerUser3._id,
      farmName: 'Desai Agro',
      location: 'Satara',
      cropTypes: ['Soyabean'],
      contactPhone: '9988776655',
      isVerified: true,
    });

    const farmer4 = await Farmer.create({
      user: farmerUser4._id,
      farmName: 'Nair Harvest Co',
      location: 'Pune',
      cropTypes: ['Wheat', 'Onion'],
      contactPhone: '9112233445',
      isVerified: true,
    });

    console.log('Seeding Centres...');

    const centre1 = await Centre.create({
      name: 'Pune Main Market Yard',
      location: {
        address: 'APMC Market Yard, Gultekdi',
        district: 'Pune',
        state: 'Maharashtra',
      },
      capacityPerDay: 100,
      activeCommodities: ['Wheat', 'Soyabean', 'Onion'],
      operatingHours: { open: '08:00', close: '17:00' },
      numberOfCounters: 2,
      slotDurationMinutes: 30,
      slotCapacity: 5,
      contactInfo: { phone: '+912012345678', email: 'pune@agriflow.com' },
    });

    const centre2 = await Centre.create({
      name: 'Nashik APMC',
      location: {
        address: 'Peth Road, Panchavati',
        district: 'Nashik',
        state: 'Maharashtra',
      },
      capacityPerDay: 50,
      activeCommodities: ['Onion', 'Grapes'],
      operatingHours: { open: '08:00', close: '16:00' },
      numberOfCounters: 1,
      slotDurationMinutes: 30,
      slotCapacity: 3,
      contactInfo: { phone: '+912534567890', email: 'nashik@agriflow.com' },
    });

    console.log('Seeding Appointments and Queue...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Today's appointments for queue demo
    const apptC1F1 = await Appointment.create({
      tokenNumber: 'TKN-260916-A1',
      farmer: farmer1._id,
      centre: centre1._id,
      scheduledDate: today,
      timeSlot: '08:00-08:30',
      commodity: 'Wheat',
      estimatedQuantity: 500,
      status: 'arrived',
    });

    const apptC1F2 = await Appointment.create({
      tokenNumber: 'TKN-260916-A2',
      farmer: farmer2._id,
      centre: centre1._id,
      scheduledDate: today,
      timeSlot: '08:00-08:30',
      commodity: 'Onion',
      estimatedQuantity: 200,
      status: 'arrived',
    });

    const apptC1F3 = await Appointment.create({
      tokenNumber: 'TKN-260916-A3',
      farmer: farmer3._id,
      centre: centre1._id,
      scheduledDate: today,
      timeSlot: '08:30-09:00',
      commodity: 'Soyabean',
      estimatedQuantity: 300,
      status: 'arrived',
    });

    const apptC1F4 = await Appointment.create({
      tokenNumber: 'TKN-260916-A4',
      farmer: farmer4._id,
      centre: centre1._id,
      scheduledDate: today,
      timeSlot: '08:30-09:00',
      commodity: 'Wheat',
      estimatedQuantity: 450,
      status: 'arrived',
    });

    // Nashik appointment
    const apptC2F2 = await Appointment.create({
      tokenNumber: 'TKN-260916-B1',
      farmer: farmer2._id,
      centre: centre2._id,
      scheduledDate: today,
      timeSlot: '08:00-08:30',
      commodity: 'Onion',
      estimatedQuantity: 150,
      status: 'arrived',
    });

    // Tomorrow appointment (future, not in queue)
    await Appointment.create({
      tokenNumber: 'TKN-260917-F1',
      farmer: farmer1._id,
      centre: centre1._id,
      scheduledDate: tomorrow,
      timeSlot: '09:00-09:30',
      commodity: 'Wheat',
      estimatedQuantity: 600,
      status: 'scheduled',
    });

    // BookingSlots
    await BookingSlot.create({
      centre: centre1._id, date: todayStr, timeSlot: '08:00-08:30',
      maxCapacity: centre1.numberOfCounters * centre1.slotCapacity, bookedCount: 2,
    });
    await BookingSlot.create({
      centre: centre1._id, date: todayStr, timeSlot: '08:30-09:00',
      maxCapacity: centre1.numberOfCounters * centre1.slotCapacity, bookedCount: 2,
    });
    await BookingSlot.create({
      centre: centre2._id, date: todayStr, timeSlot: '08:00-08:30',
      maxCapacity: centre2.numberOfCounters * centre2.slotCapacity, bookedCount: 1,
    });
    await BookingSlot.create({
      centre: centre1._id, date: tomorrowStr, timeSlot: '09:00-09:30',
      maxCapacity: centre1.numberOfCounters * centre1.slotCapacity, bookedCount: 1,
    });

    // ------------------------------------------------------------------
    // Queue demo for Pune Main Market Yard (centre1)
    // Token 1: completed (farmer4, earlier)
    // Token 2: in-progress (farmer1, being served now)
    // Token 3: waiting (farmer2)
    // Token 4: waiting (farmer3)
    // ------------------------------------------------------------------
    const now = new Date();
    const earlier = new Date(now.getTime() - 45 * 60000); // 45 min ago
    const evenEarlier = new Date(now.getTime() - 90 * 60000);

    // Token 1 — completed (farmer4's earlier visit - same farmer, different appointment for demo)
    await Queue.create({
      centre: centre1._id,
      appointment: apptC1F4._id,
      farmer: farmer4._id,
      tokenNumber: 1,
      status: 'completed',
      joinedAt: evenEarlier,
      completedAt: earlier,
    });
    await Appointment.findByIdAndUpdate(apptC1F4._id, { status: 'completed' });

    // Token 2 — in-progress (farmer1, being served)
    await Queue.create({
      centre: centre1._id,
      appointment: apptC1F1._id,
      farmer: farmer1._id,
      tokenNumber: 2,
      status: 'in-progress',
      joinedAt: new Date(now.getTime() - 10 * 60000),
      expectedTime: now,
    });

    // Token 3 — waiting (farmer2)
    await Queue.create({
      centre: centre1._id,
      appointment: apptC1F2._id,
      farmer: farmer2._id,
      tokenNumber: 3,
      status: 'waiting',
      joinedAt: new Date(now.getTime() - 8 * 60000),
    });

    // Token 4 — waiting (farmer3)
    await Queue.create({
      centre: centre1._id,
      appointment: apptC1F3._id,
      farmer: farmer3._id,
      tokenNumber: 4,
      status: 'waiting',
      joinedAt: new Date(now.getTime() - 5 * 60000),
    });

    // DailyCounter for centre1 today (4 tokens already issued)
    await DailyCounter.create({ centre: centre1._id, date: todayStr, tokenCounter: 4 });

    // ------------------------------------------------------------------
    // Queue demo for Nashik APMC (centre2): Token 1 in-progress
    // ------------------------------------------------------------------
    await Queue.create({
      centre: centre2._id,
      appointment: apptC2F2._id,
      farmer: farmer2._id,
      tokenNumber: 1,
      status: 'in-progress',
      joinedAt: new Date(now.getTime() - 15 * 60000),
      expectedTime: now,
    });
    await DailyCounter.create({ centre: centre2._id, date: todayStr, tokenCounter: 1 });

    console.log('Seeding Procurements & Payments...');

    const procurement1 = await Procurement.create({
      farmer: farmer4._id,
      centre: centre1._id,
      appointment: apptC1F4._id,
      commodity: 'Wheat',
      actualQuantity: 440,
      qualityGrade: 'A',
      ratePerKg: 25,
      totalAmount: 11000,
      status: 'paid',
    });

    await Payment.create({
      procurement: procurement1._id,
      farmer: farmer4._id,
      amount: 11000,
      method: 'bank_transfer',
      transactionId: 'TXN' + Math.floor(Math.random() * 100000000),
      status: 'successful',
      paidAt: earlier,
    });

    // Phase 7 demo procurements across lifecycle stages
    const procVerified = await Procurement.create({
      farmer: farmer1._id,
      centre: centre1._id,
      appointment: apptC1F1._id,
      commodity: 'Wheat',
      actualQuantity: 480,
      qualityGrade: 'A',
      ratePerKg: 26,
      totalAmount: 12480,
      status: 'verified',
      verifiedAt: new Date(now.getTime() - 20 * 60000),
      verificationNotes: 'Farmer verified at counter 1.',
    });

    const procWeighed = await Procurement.create({
      farmer: farmer2._id,
      centre: centre2._id,
      appointment: apptC2F2._id,
      commodity: 'Onion',
      actualQuantity: 190,
      qualityGrade: 'B',
      ratePerKg: 18,
      totalAmount: 3420,
      status: 'weighed',
      verifiedAt: new Date(now.getTime() - 30 * 60000),
      weighedAt: new Date(now.getTime() - 10 * 60000),
      weighingDetails: { netWeight: 190, tareWeight: 12, grade: 'B' },
      verificationNotes: 'Verified at Nashik APMC.',
    });

    const procProcured = await Procurement.create({
      farmer: farmer3._id,
      centre: centre1._id,
      appointment: apptC1F3._id,
      commodity: 'Soyabean',
      actualQuantity: 310,
      qualityGrade: 'A',
      ratePerKg: 22,
      totalAmount: 6820,
      status: 'procured',
      verifiedAt: new Date(now.getTime() - 40 * 60000),
      weighedAt: new Date(now.getTime() - 25 * 60000),
      procuredAt: new Date(now.getTime() - 5 * 60000),
      weighingDetails: { netWeight: 310, tareWeight: 10, grade: 'A' },
      verificationNotes: 'Verified and weighed.',
    });

    const procPaymentInitiated = await Procurement.create({
      farmer: farmer1._id,
      centre: centre1._id,
      appointment: apptC1F1._id,
      commodity: 'Wheat',
      actualQuantity: 500,
      qualityGrade: 'A',
      ratePerKg: 27,
      totalAmount: 13500,
      status: 'payment_initiated',
      verifiedAt: new Date(now.getTime() - 50 * 60000),
      weighedAt: new Date(now.getTime() - 35 * 60000),
      procuredAt: new Date(now.getTime() - 15 * 60000),
      paymentInitiatedAt: new Date(now.getTime() - 2 * 60000),
      weighingDetails: { netWeight: 500, tareWeight: 15, grade: 'A' },
    });

    await Payment.create({
      procurement: procPaymentInitiated._id,
      farmer: farmer1._id,
      amount: 13500,
      method: 'upi',
      transactionId: 'TXN-PAY-' + Math.floor(Math.random() * 100000000),
      status: 'processing',
      paidAt: null,
    });

    // Additional Phase 8 demo payments in different states
    await Payment.create({
      procurement: procurement1._id,
      farmer: farmer4._id,
      amount: 11000,
      method: 'cash',
      transactionId: 'TXN-CASH-' + Math.floor(Math.random() * 100000000),
      status: 'pending',
      paidAt: null,
    });

    await Payment.create({
      procurement: procWeighed._id,
      farmer: farmer2._id,
      amount: 3420,
      method: 'bank_transfer',
      transactionId: 'TXN-BT-' + Math.floor(Math.random() * 100000000),
      status: 'failed',
      paidAt: null,
    });

    console.log('Seeding Notifications...');

    await Notification.create({
      user: farmerUser1._id,
      title: 'Token Called',
      message: 'Token #2 is being served. Please proceed to Counter 1.',
      type: 'queue',
      isRead: false,
    });

    await Notification.create({
      user: farmerUser2._id,
      title: 'Queue Update',
      message: 'You are #3 in queue at Pune Main Market Yard. Estimated wait: ~30 min.',
      type: 'queue',
      isRead: false,
    });

    // Phase 9 demo notifications across types and read states
    await Notification.create({
      user: farmerUser1._id,
      title: 'Appointment Booked',
      message: 'Your appointment for Wheat at 08:00 is confirmed.',
      type: 'appointment',
      isRead: true,
    });
    await Notification.create({
      user: farmerUser3._id,
      title: 'Appointment Cancelled',
      message: 'Your appointment for Soyabean has been cancelled.',
      type: 'appointment',
      isRead: false,
    });
    await Notification.create({
      user: farmerUser1._id,
      title: 'Procurement Verified',
      message: 'Your Wheat procurement has been verified.',
      type: 'payment',
      isRead: false,
    });
    await Notification.create({
      user: adminUser._id,
      title: 'Payment Completed',
      message: 'Farmer Priya Nair payment of ₹11000 completed.',
      type: 'payment',
      isRead: false,
    });
    await Notification.create({
      user: farmerUser4._id,
      title: 'Payment Initiated',
      message: 'Your Wheat payment of ₹11000 has been initiated.',
      type: 'payment',
      isRead: true,
    });

    await AuditLog.create({
      actor: adminUser._id,
      action: 'SYSTEM_INIT',
      targetModel: 'System',
      targetId: adminUser._id,
      details: { message: 'Phase 6 seed: queue demo data loaded.' },
      ipAddress: '127.0.0.1',
    });

    // Phase 10 — audit log demo entries
    await AuditLog.create({
      actor: adminUser._id,
      action: 'CENTRE_CREATED',
      targetModel: 'Centre',
      targetId: centre1._id,
      centre: centre1._id,
      details: { name: centre1.name, location: 'Pune' },
      ipAddress: '127.0.0.1',
    });
    await AuditLog.create({
      actor: adminUser._id,
      action: 'CENTRE_UPDATED',
      targetModel: 'Centre',
      targetId: centre2._id,
      centre: centre2._id,
      details: { fields: ['capacityPerDay', 'operatingHours'] },
      ipAddress: '192.168.1.10',
    });
    await AuditLog.create({
      actor: farmerUser1._id,
      action: 'APPOINTMENT_BOOKED',
      targetModel: 'Appointment',
      targetId: apptC1F1._id,
      centre: centre1._id,
      details: { commodity: 'Wheat', slot: '08:00-08:30' },
      ipAddress: '127.0.0.1',
    });
    await AuditLog.create({
      actor: adminUser._id,
      action: 'APPOINTMENT_CANCELLED',
      targetModel: 'Appointment',
      targetId: apptC1F3._id,
      centre: centre1._id,
      details: { reason: 'Farmer request' },
      ipAddress: '10.0.0.5',
    });
    const queueEntry = await Queue.findOne({ centre: centre1._id, farmer: farmer1._id });
    await AuditLog.create({
      actor: adminUser._id,
      action: 'QUICK_CHECKIN',
      targetModel: 'Queue',
      targetId: queueEntry ? queueEntry._id : centre1._id,
      centre: centre1._id,
      details: { token: 2, status: 'in-progress' },
      ipAddress: '127.0.0.1',
    });
    await AuditLog.create({
      actor: adminUser._id,
      action: 'PROCUREMENT_VERIFIED',
      targetModel: 'Procurement',
      targetId: procVerified._id,
      centre: centre1._id,
      details: { grade: 'A', commodity: 'Wheat' },
      ipAddress: '127.0.0.1',
    });
    await AuditLog.create({
      actor: adminUser._id,
      action: 'PAYMENT_COMPLETED',
      targetModel: 'Payment',
      targetId: (await Payment.findOne({ farmer: farmer4._id, status: 'successful' }))._id,
      centre: centre1._id,
      details: { amount: 11000, method: 'bank_transfer' },
      ipAddress: '192.168.1.20',
    });

    console.log('Database seeded successfully 🌱');
    console.log('');
    console.log('Demo accounts:');
    console.log('  Admin   : admin@agriflow.com   / Password123');
    console.log('  Farmer 1: ramesh@farm.com      / Password123  (token #2, in-progress at Pune)');
    console.log('  Farmer 2: suresh@farm.com      / Password123  (token #3, waiting at Pune)');
    console.log('  Farmer 3: anil@farm.com        / Password123  (token #4, waiting at Pune)');
    console.log('  Farmer 4: priya@farm.com       / Password123  (token #1, completed at Pune)');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
