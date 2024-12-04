# GHL MCP Integration

Model Context Protocol integration for Go High Level API key management.

## Features

- Automated GHL login
- Sub-account API key generation
- Database storage of API keys
- MCP-compliant server implementation

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Create the database using `src/database/schema.sql`
5. Start the server: `npm start`

## Usage

The MCP server exposes a `ghl-api-key` resource with a `generateKey` method that accepts a sub-account ID parameter.

### Example

```javascript
const result = await server.resources['ghl-api-key'].generateKey('sub-account-123');
console.log(result.apiKey);
```

## Security Considerations

- Store credentials securely
- Implement proper access controls
- Monitor API key usage
- Regularly rotate credentials