const hypervergeService = require('../services/hypervergeService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const handleWebhook = asyncHandler(async (req, res) => {
  const webhookPayload = req.body;

  logger.info('Webhook received', {
    eventType: webhookPayload.eventType,
    transactionId: webhookPayload.transactionId,
    applicationStatus: webhookPayload.applicationStatus,
    eventId: webhookPayload.eventId
  });

  res.status(200).json({
    success: true,
    message: 'Webhook received successfully'
  });

  setImmediate(async () => {
    try {
      if (webhookPayload.transactionId) {
        const logsData = await hypervergeService.getTransactionLogs(webhookPayload.transactionId);

        logger.info('Transaction logs fetched from webhook', {
          transactionId: webhookPayload.transactionId,
          status: logsData.status
        });

        logger.info('Full transaction data', {
          transactionId: webhookPayload.transactionId,
          webhookPayload,
          logsData
        });
      }
    } catch (error) {
      logger.error('Error processing webhook asynchronously', {
        transactionId: webhookPayload.transactionId,
        error: error.message
      });
    }
  });
});

module.exports = {
  handleWebhook
};
