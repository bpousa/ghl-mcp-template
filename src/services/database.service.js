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

  async storeApiKey({ locationId, agencyId, apiKey, metadata = {} }) {
    try {
      const query = `
        INSERT INTO ghl_api_keys (
          location_id,
          agency_id,
          api_key,
          location_name,
          agency_name,
          generated_by,
          generated_at,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        api_key = VALUES(api_key),
        location_name = VALUES(location_name),
        agency_name = VALUES(agency_name),
        generated_by = VALUES(generated_by),
        generated_at = VALUES(generated_at),
        updated_at = NOW()
      `;

      await this.pool.execute(query, [
        locationId,
        agencyId,
        apiKey,
        metadata.locationName || null,
        metadata.agencyName || null,
        metadata.generatedBy || 'webhook',
        metadata.generatedAt || new Date().toISOString()
      ]);

      return true;
    } catch (error) {
      console.error('Database operation failed:', error);
      throw new Error('Failed to store API key in database');
    }
  }
}

module.exports = { DatabaseService };