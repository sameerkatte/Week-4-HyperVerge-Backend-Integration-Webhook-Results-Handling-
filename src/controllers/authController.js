const hypervergeService = require('../services/hypervergeService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getAuthToken = asyncHandler(async (req, res) => {
  logger.info('Auth token requested');

  const token = await hypervergeService.generateAuthToken();

  res.json({
    success: true,
    token,
    expiresIn: '30 minutes',
    message: 'Auth token generated successfully'
  });
});

module.exports = {
  getAuthToken
};
