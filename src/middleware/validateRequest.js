const { validationResult, body } = require('express-validator');
const { AppError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => `${err.path}: ${err.msg}`).join(', ');
    throw new AppError(errorMessages, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT);
  }
  next();
};

const validateTransactionId = [
  body('transactionId')
    .exists().withMessage('transactionId is required')
    .isString().withMessage('transactionId must be a string')
    .trim()
    .notEmpty().withMessage('transactionId cannot be empty'),
  handleValidationErrors
];

const validateWebhookPayload = [
  body('transactionId')
    .optional()
    .isString().withMessage('transactionId must be a string'),
  body('eventType')
    .optional()
    .isString().withMessage('eventType must be a string'),
  handleValidationErrors
];

module.exports = {
  validateTransactionId,
  validateWebhookPayload,
  handleValidationErrors
};
