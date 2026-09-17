const fs = require('fs');
let content = fs.readFileSync('seeder.js', 'utf8');

// replace Appointment.create calls with explicit tokens
content = content.replace(
  /const appointment1 = await Appointment\.create\({/g,
  "const appointment1 = await Appointment.create({ tokenNumber: 'TKN-DEMO-1234',"
);
content = content.replace(
  /const appointment2 = await Appointment\.create\({/g,
  "const appointment2 = await Appointment.create({ tokenNumber: 'TKN-DEMO-5678',"
);
content = content.replace(
  /const appointment3 = await Appointment\.create\({/g,
  "const appointment3 = await Appointment.create({ tokenNumber: 'TKN-DEMO-9012',"
);

// Add BookingSlot model import
content = content.replace(
  /const Appointment = require\('\.\/models\/Appointment'\);/g,
  "const Appointment = require('./models/Appointment');\nconst BookingSlot = require('./models/BookingSlot');"
);

// Add BookingSlot creation logic right after appointment3 is created
const bookingSlotLogic = `
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    await BookingSlot.create({
      centre: centre1._id, date: tomorrowStr, timeSlot: '09:00-11:00', maxCapacity: centre1.numberOfCounters * centre1.slotCapacity, bookedCount: 1
    });
    await BookingSlot.create({
      centre: centre2._id, date: todayStr, timeSlot: '11:00-13:00', maxCapacity: centre2.numberOfCounters * centre2.slotCapacity, bookedCount: 1
    });
    await BookingSlot.create({
      centre: centre1._id, date: todayStr, timeSlot: '07:00-09:00', maxCapacity: centre1.numberOfCounters * centre1.slotCapacity, bookedCount: 1
    });
`;

content = content.replace(
  /(\/\/ 5\. Create Queues)/,
  bookingSlotLogic + "\n    $1"
);

fs.writeFileSync('seeder.js', content, 'utf8');
