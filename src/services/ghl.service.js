const puppeteer = require('puppeteer');
const { ProxyRotator } = require('./proxy.service');
require('dotenv').config();

class GHLService {
  constructor(credentials) {
    this.browser = null;
    this.page = null;
    this.credentials = credentials;
    this.proxyRotator = new ProxyRotator(process.env.VPN_PROVIDER_API_KEY);
  }

  async launchBrowser() {
    const proxy = await this.proxyRotator.getNextProxy();
    
    this.browser = await puppeteer.launch({ 
      headless: 'new',
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        `--proxy-server=${proxy.host}:${proxy.port}`,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set proxy authentication if required
    if (proxy.username && proxy.password) {
      await this.page.authenticate({
        username: proxy.username,
        password: proxy.password
      });
    }

    // Add residential browser fingerprint
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    // Set geolocation if provided by proxy
    if (proxy.latitude && proxy.longitude) {
      await this.page.setGeolocation({
        latitude: proxy.latitude,
        longitude: proxy.longitude
      });
    }
  }

  async login() {
    try {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await this.launchBrowser();
          await this.page.goto('https://app.gohighlevel.com');

          // Check for CAPTCHA or other security challenges
          const hasCaptcha = await this.checkForCaptcha();
          if (hasCaptcha) {
            console.log('CAPTCHA detected, rotating proxy...');
            await this.browser.close();
            attempts++;
            continue;
          }

          await this.page.waitForSelector('#email');
          await this.page.waitForSelector('#password');
          
          // Type with random delays to appear more human-like
          await this.typeWithRandomDelays('#email', this.credentials.email);
          await this.typeWithRandomDelays('#password', this.credentials.password);
          
          await this.page.click('button[type="submit"]');
          await this.page.waitForNavigation();

          const currentUrl = this.page.url();
          if (currentUrl.includes('dashboard')) {
            console.log('Successfully logged into GHL');
            return;
          }

          throw new Error('Login unsuccessful');
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) throw error;
          await this.browser.close();
          await new Promise(r => setTimeout(r, 5000)); // Wait before retry
        }
      }
    } catch (error) {
      console.error('Login failed after multiple attempts:', error);
      throw new Error(`Failed to login to GHL: ${error.message}`);
    }
  }

  async checkForCaptcha() {
    try {
      // Check for common CAPTCHA indicators
      const captchaPresent = await this.page.evaluate(() => {
        const html = document.documentElement.innerHTML.toLowerCase();
        return html.includes('captcha') || 
               html.includes('robot') || 
               html.includes('security check');
      });
      return captchaPresent;
    } catch (error) {
      return false;
    }
  }

  async typeWithRandomDelays(selector, text) {
    await this.page.focus(selector);
    for (const char of text) {
      await this.page.keyboard.type(char);
      await new Promise(r => setTimeout(r, Math.random() * 200 + 50));
    }
  }

  // ... rest of the methods remain the same ...
}

module.exports = { GHLService };