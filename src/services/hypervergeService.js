const HttpClient = require('../utils/httpClient');
const logger = require('../utils/logger');
const config = require('../config/env');
const { HYPERVERGE_API, HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { AppError } = require('../middleware/errorHandler');

class HyperVergeService {
  constructor() {
    this.client = new HttpClient(config.hyperverge.apiBaseUrl);
    this.tokenCache = {
      token: null,
      expiresAt: null
    };
  }

  async generateAuthToken() {
    try {
      if (this.tokenCache.token && this.tokenCache.expiresAt > Date.now()) {
        logger.info('Using cached auth token');
        return this.tokenCache.token;
      }

      logger.info('Generating new HyperVerge auth token');

      const response = await this.client.post(
        HYPERVERGE_API.AUTH_TOKEN,
        {
          appId: config.hyperverge.appId,
          appKey: config.hyperverge.appKey,
          expiryTime: config.auth.tokenValidityMinutes
        }
      );

      if (response.data && response.data.result && response.data.result.token) {
        const token = response.data.result.token;

        const cacheExpiryMinutes = config.auth.tokenValidityMinutes - 5;
        this.tokenCache = {
          token,
          expiresAt: Date.now() + (cacheExpiryMinutes * 60 * 1000)
        };

        logger.info('Auth token generated successfully');
        return token;
      }

      throw new Error('Invalid response from HyperVerge auth API');
    } catch (error) {
      logger.error('Failed to generate auth token', {
        message: error.message,
        response: error.response?.data
      });

      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new AppError(
          'Invalid HyperVerge credentials',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.INVALID_CREDENTIALS
        );
      }

      throw new AppError(
        error.message || 'Failed to generate auth token',
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.HV_API_ERROR
      );
    }
  }

  async getTransactionLogs(transactionId) {
    try {
      logger.info('Fetching transaction logs', { transactionId });

      const response = await this.client.post(
        HYPERVERGE_API.RESULTS_LOGS,
        { transactionId },
        {
          headers: {
            appId: config.hyperverge.appId,
            appKey: config.hyperverge.appKey
          }
        }
      );

      if (response.data) {
        logger.info('Transaction logs fetched successfully', { transactionId });
        return response.data;
      }

      throw new Error('Invalid response from HyperVerge Logs API');
    } catch (error) {
      logger.error('Failed to fetch transaction logs', {
        transactionId,
        message: error.message,
        response: error.response?.data
      });

      if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
        throw new AppError(
          `Transaction with ID ${transactionId} not found`,
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.TRANSACTION_NOT_FOUND
        );
      }

      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new AppError(
          'Invalid HyperVerge credentials',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.INVALID_CREDENTIALS
        );
      }

      throw new AppError(
        error.message || 'Failed to fetch transaction logs',
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.HV_API_ERROR
      );
    }
  }

  async getTransactionOutputs(transactionId) {
    try {
      logger.info('Fetching transaction outputs', { transactionId });

      const response = await this.client.post(
        HYPERVERGE_API.OUTPUTS,
        { transactionId },
        {
          headers: {
            appId: config.hyperverge.appId,
            appKey: config.hyperverge.appKey
          }
        }
      );

      if (response.data) {
        logger.info('Transaction outputs fetched successfully', { transactionId });
        return response.data;
      }

      throw new Error('Invalid response from HyperVerge Outputs API');
    } catch (error) {
      logger.error('Failed to fetch transaction outputs', {
        transactionId,
        message: error.message,
        response: error.response?.data
      });

      if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
        throw new AppError(
          `Transaction with ID ${transactionId} not found`,
          HTTP_STATUS.NOT_FOUND,
          ERROR_CODES.TRANSACTION_NOT_FOUND
        );
      }

      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        throw new AppError(
          'Invalid HyperVerge credentials',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.INVALID_CREDENTIALS
        );
      }

      throw new AppError(
        error.message || 'Failed to fetch transaction outputs',
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.HV_API_ERROR
      );
    }
  }
}

module.exports = new HyperVergeService();
