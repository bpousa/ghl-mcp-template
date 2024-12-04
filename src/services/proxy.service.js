const axios = require('axios');

class ProxyRotator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.usedProxies = new Set();
  }

  async getNextProxy() {
    try {
      // IPRoyal proxy endpoint
      const response = await axios.get('https://iproyal.com/api/v1/proxy', {
        params: {
          api_key: this.apiKey,
          country: 'US',
          city: null,     // Optional: specific city
          type: 'residential',
          protocol: 'http',
          sticky: true,   // Keep same IP for the session
          timeout: 10     // seconds
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get proxy');
      }

      return {
        host: response.data.proxy.host,
        port: response.data.proxy.port,
        username: this.apiKey,    // IPRoyal uses API key as username
        password: 'proxy_pass'    // Static password for IPRoyal
      };
    } catch (error) {
      console.error('Proxy rotation failed:', error.message);
      throw new Error('Failed to get valid proxy');
    }
  }

  async validateProxy(proxy) {
    try {
      // Test proxy with a simple request
      const testResponse = await axios.get('https://api.ipify.org?format=json', {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: {
            username: proxy.username,
            password: proxy.password
          }
        },
        timeout: 10000
      });

      return testResponse.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { ProxyRotator };