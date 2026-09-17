const crypto = require('crypto');

const generateAppointmentToken = (dateStr) => {
  // dateStr expected to be 'YYYY-MM-DD'
  const dateFormatted = dateStr.replace(/-/g, '').slice(2); // YYMMDD
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
  return `TKN-${dateFormatted}-${randomChars}`;
};

module.exports = generateAppointmentToken;
