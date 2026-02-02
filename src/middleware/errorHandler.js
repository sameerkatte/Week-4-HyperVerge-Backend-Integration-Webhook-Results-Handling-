const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.isOperational) {
    error.statusCode = err.statusCode;
    error.code = err.code;
  } else {
    error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    error.code = ERROR_CODES.INTERNAL_ERROR;
  }

  logger.error('Error Handler', {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: error.code || ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'Internal server error',
      statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString()
    }
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler
};
