const hypervergeService = require('../services/hypervergeService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const getOutputs = asyncHandler(async (req, res) => {
  const { transactionId } = req.body;

  logger.info('Outputs requested', { transactionId });

  const logsData = await hypervergeService.getTransactionLogs(transactionId);

  const workflowId = logsData?.result?.workflowId || logsData?.workflowId;

  if (!workflowId) {
    logger.warn('WorkflowId not found in logs response, calling outputs API without it', { transactionId });
  }

  const outputsData = await hypervergeService.getTransactionOutputs(transactionId, workflowId);

  logger.info('Outputs fetched successfully', { transactionId });

  res.json({
    success: true,
    data: {
      transactionId,
      workflowId,
      logs: logsData,
      outputs: outputsData
    }
  });
});

module.exports = {
  getOutputs
};
