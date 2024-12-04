const { createServer } = require('@modelcontextprotocol/core');
const { GHLService } = require('./services/ghl.service');
const { DatabaseService } = require('./services/database.service');

const server = createServer({
  name: 'ghl-mcp-server',
  version: '1.0.0'
});

server.addResource({
  name: 'ghl-api-key',
  methods: {
    generateKeyFromWebhook: async (webhookData) => {
      // Validate required webhook data
      const required = ['locationId', 'ghlEmail', 'ghlPassword', 'agencyId'];
      for (const field of required) {
        if (!webhookData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      const ghlService = new GHLService({
        email: webhookData.ghlEmail,
        password: webhookData.ghlPassword,
        agencyId: webhookData.agencyId
      });
      const dbService = new DatabaseService();

      try {
        // Login and generate API key
        await ghlService.login();
        const apiKey = await ghlService.generateApiKey(webhookData.locationId);

        // Store in database with additional metadata
        await dbService.storeApiKey({
          locationId: webhookData.locationId,
          agencyId: webhookData.agencyId,
          apiKey,
          metadata: {
            generatedAt: new Date().toISOString(),
            generatedBy: webhookData.triggeredBy || 'webhook',
            locationName: webhookData.locationName,
            agencyName: webhookData.agencyName
          }
        });

        return { 
          success: true, 
          apiKey,
          locationId: webhookData.locationId,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error in generateKeyFromWebhook:', error);
        throw new Error(`Failed to generate API key: ${error.message}`);
      }
    }
  }
});

server.start().then(() => {
  console.log('MCP server started successfully');
});