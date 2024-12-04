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
    generateKey: async (subAccountId) => {
      const ghlService = new GHLService();
      const dbService = new DatabaseService();

      try {
        await ghlService.login();
        const apiKey = await ghlService.generateApiKey(subAccountId);
        await dbService.storeApiKey(subAccountId, apiKey);
        return { success: true, apiKey };
      } catch (error) {
        console.error('Error in generateKey:', error);
        throw new Error('Failed to generate API key');
      }
    }
  }
});

server.start().then(() => {
  console.log('MCP server started successfully');
});