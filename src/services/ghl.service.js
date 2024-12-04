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

      // Wait for login form and input credentials
      await this.page.waitForSelector('#email');
      await this.page.waitForSelector('#password');
      await this.page.type('#email', process.env.GHL_EMAIL);
      await this.page.type('#password', process.env.GHL_PASSWORD);
      await this.page.click('button[type="submit"]');

      // Wait for dashboard to load
      await this.page.waitForNavigation();
      console.log('Successfully logged into GHL');
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(`Failed to login to GHL: ${error.message}`);
    }
  }

  async navigateToSubAccount(locationId) {
    try {
      // Navigate to sub-account using v2 URL format
      const locationUrl = `https://app.gohighlevel.com/v2/location/${locationId}/`;
      await this.page.goto(locationUrl);
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });

      // Verify we're in the correct location
      const url = this.page.url();
      if (!url.includes(locationId)) {
        throw new Error(`Failed to navigate to location ${locationId}`);
      }

      console.log(`Successfully navigated to location ${locationId}`);
    } catch (error) {
      throw new Error(`Failed to navigate to location: ${error.message}`);
    }
  }

  async generateApiKey(locationId) {
    try {
      await this.navigateToSubAccount(locationId);

      // Click Settings
      const settingsButton = await this.page.waitForSelector('button:has-text("Settings")');
      await settingsButton.click();
      await this.page.waitForTimeout(1000); // Wait for menu animation

      // Click Business Profile
      const businessProfileLink = await this.page.waitForSelector('a:has-text("Business Profile")');
      await businessProfileLink.click();
      await this.page.waitForTimeout(2000); // Wait for page load

      // Scroll to API Key section
      await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const apiSection = elements.find(el => el.textContent.includes('API Key'));
        if (apiSection) apiSection.scrollIntoView();
      });
      await this.page.waitForTimeout(1000);

      // Click Generate API Key button
      const generateButton = await this.page.waitForSelector('button:has-text("Generate API Key")');
      await generateButton.click();
      await this.page.waitForTimeout(2000); // Wait for key generation

      // Find and click the copy icon button
      const copyButton = await this.page.waitForSelector('button[aria-label="Copy API Key"]');
      
      // Get the API key value before clicking copy
      const apiKey = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('input'));
        const apiInput = elements.find(el => el.value && el.value.length > 20); // API keys are typically long
        return apiInput ? apiInput.value : null;
      });

      if (!apiKey) {
        throw new Error('Could not find API key value');
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

  // Helper method to handle potential popups or overlays
  async handlePopups() {
    try {
      // Look for common popup close buttons or overlay dismiss buttons
      const closeButtons = await this.page.$$('button:has-text("Close"), button:has-text("×")');
      for (const button of closeButtons) {
        await button.click();
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // Ignore errors as popups are optional
      console.log('No popups found or failed to handle popup');
    }
  }
}

module.exports = { GHLService };