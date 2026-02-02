const hypervergeService = require('../services/hypervergeService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getOutputs = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  logger.info('Outputs requested', { transactionId });

  const [logsData, outputsData] = await Promise.all([
    hypervergeService.getTransactionLogs(transactionId),
    hypervergeService.getTransactionOutputs(transactionId)
  ]);

  logger.info('Outputs fetched successfully', { transactionId });

  res.json({
    success: true,
    data: {
      transactionId,
      logs: logsData,
      outputs: outputsData
    }
  });
});

module.exports = {
  getOutputs
};
