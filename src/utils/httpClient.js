const axios = require('axios');
const logger = require('./logger');

class HttpClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders
      },
      timeout: 30000
    });

    this.client.interceptors.request.use(
      (config) => {
        logger.info('HTTP Request', {
          method: config.method.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL
        });
        return config;
      },
      (error) => {
        logger.error('HTTP Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('HTTP Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error('HTTP Response Error', {
            status: error.response.status,
            url: error.config?.url,
            data: error.response.data
          });
        } else if (error.request) {
          logger.error('HTTP No Response', {
            url: error.config?.url,
            message: error.message
          });
        } else {
          logger.error('HTTP Setup Error', { message: error.message });
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

module.exports = HttpClient;
