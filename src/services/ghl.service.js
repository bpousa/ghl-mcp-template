const puppeteer = require('puppeteer');
require('dotenv').config();

class GHLService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async login() {
    try {
      this.browser = await puppeteer.launch({ headless: 'new' });
      this.page = await this.browser.newPage();
      await this.page.goto(process.env.GHL_AGENCY_URL);
      await this.page.type('input[type="email"]', process.env.GHL_EMAIL);
      await this.page.type('input[type="password"]', process.env.GHL_PASSWORD);
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation();
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Failed to login to GHL');
    }
  }

  async generateApiKey(subAccountId) {
    try {
      await this.page.goto(`${process.env.GHL_AGENCY_URL}/sub-accounts/${subAccountId}/settings/api`);
      await this.page.click('button[data-testid="generate-api-key"]');
      await this.page.waitForSelector('input[data-testid="api-key-input"]');
      const apiKey = await this.page.$eval('input[data-testid="api-key-input"]', el => el.value);
      return apiKey;
    } catch (error) {
      console.error('Generate API key failed:', error);
      throw new Error('Failed to generate API key');
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

module.exports = { GHLService };