# HyperVerge Backend Integration

A Node.js/Express backend server that integrates with HyperVerge KYC verification APIs. Handles authentication, webhook events, and results fetching.

## Features

- **Authentication API** - Generates short-lived HyperVerge auth tokens for SDK initialization
- **Webhook Listener** - Receives and processes HyperVerge transaction completion events
- **Outputs API** - Fetches transaction logs and final KYC outputs
- **Security** - Rate limiting, CORS, input validation, and API key protection
- **Logging** - Structured logging with Winston
- **Error Handling** - Comprehensive error handling and reporting

## Project Structure

```
hyperverge-backend/
├── src/
│   ├── config/           # Environment and API configuration
│   ├── controllers/      # Request handlers for each endpoint
│   ├── services/         # HyperVerge API integration
│   ├── middleware/       # Error handling, validation, rate limiting
│   ├── utils/            # Logger and HTTP client utilities
│   ├── routes/           # Route definitions
│   └── app.js            # Express app setup
├── server.js             # Entry point
├── package.json
└── .env                  # Environment variables
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- HyperVerge account with appId and appKey
- Ngrok (for local webhook testing)

## Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your HyperVerge credentials**
   ```env
   HV_APP_ID=your_actual_hyperverge_app_id
   HV_APP_KEY=your_actual_hyperverge_app_key
   ```

## Configuration

### Environment Variables

Edit the `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# HyperVerge API Configuration (REQUIRED)
HV_APP_ID=your_hyperverge_app_id
HV_APP_KEY=your_hyperverge_app_key
HV_API_BASE_URL=https://ind.idv.hyperverge.co

# Token Configuration
AUTH_TOKEN_VALIDITY_MINUTES=30

# Security
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Running the Server

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Mode

```bash
npm start
```

### Health Check

Visit `http://localhost:3000/api/health` to verify the server is running.

## API Endpoints

### 1. GET /api/auth

Generates a 30-minute expiring HyperVerge auth token for SDK initialization.

**Request:**
```bash
GET http://localhost:3000/api/auth
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30 minutes",
  "message": "Auth token generated successfully"
}
```

**Rate Limit:** 10 requests/minute per IP

### 2. POST /api/results

Webhook endpoint that receives HyperVerge transaction completion events.

**Request:**
```bash
POST http://localhost:3000/api/results
Content-Type: application/json

{
  "eventType": "FINISH_TRANSACTION_WEBHOOK",
  "eventTime": "2023-01-30T17:22:102Z",
  "applicationStatus": "auto_approved",
  "transactionId": "txn_123456",
  "eventId": "evt_789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

**Note:** The webhook processes HyperVerge API calls asynchronously after responding.

### 3. POST /api/outputs

Fetches transaction logs and final KYC outputs.

**Request:**
```bash
POST http://localhost:3000/api/outputs
Content-Type: application/json

{
  "transactionId": "txn_123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_123456",
    "logs": { ... },
    "outputs": { ... }
  }
}
```

**Rate Limit:** 100 requests/15 minutes per IP

### 4. GET /api/health

Health check endpoint.

**Request:**
```bash
GET http://localhost:3000/api/health
```

**Response:**
```json
{
  "success": true,
  "message": "HyperVerge Backend is running",
  "timestamp": "2026-02-02T12:00:00.000Z"
}
```

## Webhook Setup with Ngrok

For local development, use Ngrok to expose your server to HyperVerge:

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **In a new terminal, start Ngrok**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure HyperVerge Dashboard**
   - Login to HyperVerge dashboard
   - Navigate to Webhook Settings
   - Set Webhook URL: `https://abc123.ngrok.io/api/results`
   - Subscribe to: `FINISH_TRANSACTION_WEBHOOK`
   - Save configuration

5. **Whitelist your server IP**
   - Contact HyperVerge support to whitelist your server IP
   - Required for Logs API and Outputs API access

## Testing

### Test with cURL

**Get Auth Token:**
```bash
curl http://localhost:3000/api/auth
```

**Simulate Webhook:**
```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "FINISH_TRANSACTION_WEBHOOK",
    "transactionId": "test_txn_123",
    "applicationStatus": "auto_approved"
  }'
```

**Get Outputs:**
```bash
curl -X POST http://localhost:3000/api/outputs \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test_txn_123"
  }'
```

### Test with Frontend

1. Get auth token from `GET /api/auth`
2. Initialize HyperVerge SDK in frontend with the token
3. Complete KYC flow in SDK
4. Backend will receive webhook at `POST /api/results`
5. Frontend can fetch results using `POST /api/outputs`

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction with ID txn_123 not found",
    "statusCode": 404,
    "timestamp": "2026-02-02T12:00:00.000Z"
  }
}
```

**Common Error Codes:**
- `INVALID_CREDENTIALS` - Invalid HyperVerge appId/appKey
- `TRANSACTION_NOT_FOUND` - Transaction ID not found
- `INVALID_INPUT` - Invalid request parameters
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `HV_API_ERROR` - HyperVerge API error
- `INTERNAL_ERROR` - Server error

## Security Best Practices

1. **Never expose appId/appKey** - Keep them in `.env` file only
2. **Use HTTPS in production** - Configure SSL/TLS certificate
3. **Whitelist CORS origins** - Update `CORS_ORIGIN` in `.env`
4. **Rate limiting** - Configured by default, adjust in `.env`
5. **Input validation** - Automatic validation on all endpoints
6. **IP whitelisting** - Whitelist server IP in HyperVerge dashboard

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (if using storage)
- [ ] Set up SSL/TLS certificate
- [ ] Configure reverse proxy (Nginx)
- [ ] Whitelist production server IP in HyperVerge dashboard
- [ ] Update webhook URL in HyperVerge dashboard
- [ ] Set up monitoring and logging
- [ ] Use process manager (PM2)
- [ ] Configure auto-restart on crash
- [ ] Set up backups

### Deploy with PM2

```bash
npm install -g pm2
pm2 start server.js --name hyperverge-backend
pm2 startup
pm2 save
```

### Cloud Deployment Options

- **AWS**: EC2, ECS, Lambda
- **Google Cloud**: Compute Engine, Cloud Run
- **Azure**: App Service, Container Instances
- **Heroku/Railway/Render**: Simple deployment

## Troubleshooting

### Server won't start

- Check if `.env` file exists with valid credentials
- Verify `HV_APP_ID` and `HV_APP_KEY` are set
- Check if port 3000 is already in use

### Auth token generation fails

- Verify HyperVerge credentials are correct
- Check if HyperVerge API is accessible
- Review logs for error details

### Webhook not receiving events

- Verify Ngrok is running and URL is correct
- Check webhook configuration in HyperVerge dashboard
- Ensure server is publicly accessible

### Transaction not found error

- Verify transaction ID is correct
- Check if server IP is whitelisted in HyperVerge dashboard
- Wait a few seconds after SDK completion before fetching

## Logs

Logs are printed to console with the following format:

```
2026-02-02 12:00:00 [info]: Server started on port 3000
2026-02-02 12:01:00 [info]: Auth token requested
2026-02-02 12:02:00 [error]: Failed to fetch transaction logs
```

Log levels: `error`, `warn`, `info`, `debug`

Configure log level in `.env`:
```env
LOG_LEVEL=info
```

## Support

For issues or questions:
- Check [HyperVerge Documentation](https://documentation.hyperverge.co/)
- Review logs for error details
- Contact HyperVerge support for API-related issues

## License

ISC
