const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies the Bearer JWT and attaches req.user = { id, role }.
 * Rejects with 401 if missing or invalid.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorised — no token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach a minimal user payload; avoid an extra DB hit on every request.
    // Full user object can be fetched by routes that need it.
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    // jwt.verify throws its own errors (TokenExpiredError, JsonWebTokenError)
    if (err.name === 'TokenExpiredError') {
      res.status(401);
      return next(new Error('Session expired — please log in again'));
    }
    if (err.name === 'JsonWebTokenError') {
      res.status(401);
      return next(new Error('Invalid token — please log in again'));
    }
    next(err);
  }
};

/**
 * adminOnly — must come AFTER protect.
 * Rejects with 403 if the authenticated user is not an admin.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  next(new Error('Access denied — admin only'));
};

module.exports = { protect, adminOnly };
