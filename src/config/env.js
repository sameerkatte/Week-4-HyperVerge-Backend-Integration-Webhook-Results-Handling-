require('dotenv').config();

const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000
  },
  hyperverge: {
    appId: process.env.HV_APP_ID,
    appKey: process.env.HV_APP_KEY,
    apiBaseUrl: process.env.HV_API_BASE_URL || 'https://ind.idv.hyperverge.co'
  },
  auth: {
    tokenValidityMinutes: parseInt(process.env.AUTH_TOKEN_VALIDITY_MINUTES, 10) || 30
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

const validateConfig = () => {
  const requiredFields = [
    { key: 'hyperverge.appId', value: config.hyperverge.appId },
    { key: 'hyperverge.appKey', value: config.hyperverge.appKey }
  ];

  const missing = requiredFields.filter(field => !field.value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(f => f.key).join(', ')}. ` +
      'Please check your .env file.'
    );
  }
};

if (config.server.nodeEnv !== 'test') {
  validateConfig();
}

module.exports = config;
