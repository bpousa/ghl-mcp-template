const axios = require('axios');

class ProxyRotator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.usedProxies = new Set();
    this.currentProxy = null;
  }

  async getNextProxy() {
    try {
      // This is a placeholder - replace with your actual proxy provider's API
      const response = await axios.get(`https://proxy-provider.com/api/v1/proxies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        params: {
          country: 'US',          // Request US proxies
          type: 'residential',    // Use residential IPs
          session: 'new'          // Request new session
        }
      });

      const proxy = response.data.proxy;
      
      // Verify we haven't used this IP recently
      if (this.usedProxies.has(proxy.ip)) {
        return this.getNextProxy(); // Try again if we've used this IP
      }

      // Add to used proxies and remove oldest if we're tracking too many
      this.usedProxies.add(proxy.ip);
      if (this.usedProxies.size > 100) {
        const firstUsed = this.usedProxies.values().next().value;
        this.usedProxies.delete(firstUsed);
      }

      this.currentProxy = proxy;
      return {
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
        latitude: proxy.latitude,
        longitude: proxy.longitude
      };
    } catch (error) {
      console.error('Failed to get proxy:', error);
      throw new Error('Failed to get valid proxy');
    }
  }

  async releaseProxy() {
    if (this.currentProxy) {
      try {
        // Some proxy providers require explicitly releasing proxies
        await axios.post(`https://proxy-provider.com/api/v1/release`, {
          ip: this.currentProxy.ip
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
      } catch (error) {
        console.error('Failed to release proxy:', error);
      }
    }
  }
}

module.exports = { ProxyRotator };