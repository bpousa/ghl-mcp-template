const puppeteer = require('puppeteer');
require('dotenv').config();

class GHLService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async login() {
    try {
      this.browser = await puppeteer.launch({ 
        headless: 'new',
        defaultViewport: { width: 1920, height: 1080 }
      });
      this.page = await this.browser.newPage();

      // Navigate to GHL login page
      await this.page.goto('https://app.gohighlevel.com');

      // Wait for login form to load
      await this.page.waitForSelector('#email');
      await this.page.waitForSelector('#password');

      // Type credentials
      await this.page.type('#email', process.env.GHL_EMAIL);
      await this.page.type('#password', process.env.GHL_PASSWORD);

      // Click login button
      await this.page.click('button[type="submit"]');

      // Wait for dashboard to load
      await this.page.waitForNavigation();

      // Check if login was successful
      const currentUrl = this.page.url();
      if (!currentUrl.includes('dashboard')) {
        throw new Error('Login failed - redirected to ' + currentUrl);
      }

      console.log('Successfully logged into GHL');
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(`Failed to login to GHL: ${error.message}`);
    }
  }

  async navigateToSubAccount(subAccountId) {
    try {
      // Navigate to sub-account selection
      await this.page.goto(`https://app.gohighlevel.com/location/${subAccountId}`);
      await this.page.waitForNavigation();

      // Verify we're in the correct sub-account
      const url = this.page.url();
      if (!url.includes(subAccountId)) {
        throw new Error(`Failed to navigate to sub-account ${subAccountId}`);
      }

      console.log(`Successfully navigated to sub-account ${subAccountId}`);
    } catch (error) {
      throw new Error(`Failed to navigate to sub-account: ${error.message}`);
    }
  }

  async generateApiKey(subAccountId) {
    try {
      await this.navigateToSubAccount(subAccountId);

      // Navigate to API settings
      await this.page.goto(`https://app.gohighlevel.com/location/${subAccountId}/settings/api`);
      await this.page.waitForTimeout(2000); // Wait for page to fully load

      // Look for Generate API Key button and click it
      const generateButton = await this.page.waitForSelector('button:has-text("Generate API Key")');
      await generateButton.click();

      // Wait for the modal or API key field to appear
      await this.page.waitForSelector('input[aria-label="API Key"]');

      // Get the API key
      const apiKey = await this.page.$eval('input[aria-label="API Key"]', el => el.value);

      if (!apiKey) {
        throw new Error('API key generation failed - no key found');
      }

      console.log('Successfully generated API key');
      return apiKey;
    } catch (error) {
      console.error('Generate API key failed:', error);
      throw new Error(`Failed to generate API key: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

module.exports = { GHLService };