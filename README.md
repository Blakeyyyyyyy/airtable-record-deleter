# Airtable Record Deleter Service

A Node.js/TypeScript automation service for deleting records from Airtable via REST API.

## Features

- **Single Record Deletion**: Delete individual records by ID
- **Batch Record Deletion**: Delete multiple records in a single request (up to 10)
- **Error Handling**: Robust error handling with appropriate HTTP status codes
- **Health Checks**: Built-in health check endpoints for monitoring
- **Environment Configuration**: Secure configuration via environment variables

## API Endpoints

### Health & Status
- `GET /` - Service information and available endpoints
- `GET /healthz` - Health check endpoint
- `GET /version` - Service version information

### Record Operations
- `DELETE /api/records/{recordId}` - Delete a single record by ID
- `POST /api/records/batch-delete` - Delete multiple records

#### Batch Delete Request Format
```json
{
  "recordIds": ["recXXXXXXXXXXXXXX", "recYYYYYYYYYYYYYY"]
}
```

## Environment Variables

Set these environment variables in your deployment:

- `AIRTABLE_BASE_ID` - Your Airtable base ID (e.g., `appkFjwZcHgh04shT`)
- `AIRTABLE_TABLE_NAME` - The table name to delete from (e.g., `responses`)
- `AIRTABLE_PAT` - Your Airtable Personal Access Token
- `PORT` - Server port (optional, defaults to 3000)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Blakeyyyyyyy/airtable-record-deleter.git
cd airtable-record-deleter
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template and fill in your values:
```bash
cp .env.example .env
# Edit .env with your actual Airtable credentials
```

4. Run in development mode:
```bash
npm run dev
```

5. Build and run for production:
```bash
npm run build
npm start
```

## Deployment

### Render Deployment

This service is configured to deploy to Render:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/healthz`

Ensure you set the environment variables in your Render service dashboard.

## Security

- Never commit your `.env` file or actual API tokens to version control
- Use environment variables for all sensitive configuration
- The service validates all required environment variables on startup

## Error Handling

The service provides detailed error responses:

- `400 Bad Request` - Invalid or missing parameters
- `404 Not Found` - Record not found in Airtable
- `500 Internal Server Error` - Airtable API errors or server issues

## Rate Limits

Follows Airtable API rate limits:
- Single record deletion: Standard API limits apply
- Batch deletion: Maximum 10 records per request