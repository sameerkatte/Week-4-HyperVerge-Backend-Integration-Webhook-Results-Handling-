const express = require('express');
const authController = require('../controllers/authController');
const webhookController = require('../controllers/webhookController');
const outputsController = require('../controllers/outputsController');
const { authLimiter, outputsLimiter } = require('../middleware/rateLimiter');
const { validateTransactionId, validateWebhookPayload } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/auth', authLimiter, authController.getAuthToken);

router.post('/results', validateWebhookPayload, webhookController.handleWebhook);

router.post('/outputs', outputsLimiter, validateTransactionId, outputsController.getOutputs);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HyperVerge Backend is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
