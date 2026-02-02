const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: message || 'Too many requests, please try again later',
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString()
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const authLimiter = createRateLimiter(
  60 * 1000,
  10,
  'Too many auth requests from this IP, please try again after a minute'
);

const outputsLimiter = createRateLimiter(
  config.security.rateLimitWindowMs,
  config.security.rateLimitMaxRequests,
  'Too many requests from this IP, please try again later'
);

module.exports = {
  authLimiter,
  outputsLimiter,
  createRateLimiter
};
