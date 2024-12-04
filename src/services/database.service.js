const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseService {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }

  async storeApiKey(subAccountId, apiKey) {
    try {
      const query = `
        INSERT INTO ghl_api_keys (sub_account_id, api_key, created_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        api_key = VALUES(api_key),
        updated_at = NOW()
      `;

      await this.pool.execute(query, [subAccountId, apiKey]);
      return true;
    } catch (error) {
      console.error('Database operation failed:', error);
      throw new Error('Failed to store API key in database');
    }
  }
}

module.exports = { DatabaseService };