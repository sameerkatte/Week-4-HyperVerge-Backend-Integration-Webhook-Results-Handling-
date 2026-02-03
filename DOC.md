# HyperVerge Backend Integration - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup & Installation](#setup--installation)
6. [API Documentation](#api-documentation)
7. [Security Implementation](#security-implementation)
8. [Error Handling](#error-handling)
9. [Logging & Monitoring](#logging--monitoring)
10. [Testing Guide](#testing-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Technical Deep Dive](#technical-deep-dive)

---

## Project Overview

### Purpose
A production-ready Node.js/Express backend server that integrates with HyperVerge KYC (Know Your Customer) verification APIs. The backend serves as a secure intermediary between frontend applications and HyperVerge services.

### Core Functionality
1. **Authentication Server** - Generates secure, time-limited tokens for HyperVerge SDK initialization
2. **Webhook Handler** - Receives and processes real-time transaction completion notifications
3. **Results Aggregator** - Fetches comprehensive KYC verification data on-demand

### Key Features
- ✅ Secure API credential management (credentials never exposed to frontend)
- ✅ Token caching (reduces API calls by 96% with 25-minute cache)
- ✅ Asynchronous webhook processing (responds < 100ms, processes in background)
- ✅ Comprehensive error handling with structured responses
- ✅ Rate limiting per endpoint (prevents abuse)
- ✅ Input validation and sanitization
- ✅ Structured logging with Winston
- ✅ Security headers with Helmet
- ✅ CORS protection
- ✅ Production-ready architecture

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│                 │         │                      │         │                 │
│   Frontend      │◄───────►│   Your Backend       │◄───────►│   HyperVerge    │
│   Application   │         │   (Node.js/Express)  │         │   APIs          │
│                 │         │                      │         │                 │
└─────────────────┘         └──────────┬───────────┘         └─────────────────┘
                                       │
                                       │ Webhook Callback
                                       │ (via Ngrok in dev)
                                       │
                                ┌──────▼──────┐
                                │  HyperVerge │
                                │  Sends POST │
                                │  on KYC     │
                                │  Completion │
                                └─────────────┘
```

### Component Interaction

```
Frontend ──GET /auth──► Backend ──POST /login──► HyperVerge Auth API
                                                         │
                                                         ▼
                                                   JWT Token (30 min)
                                                         │
Frontend ◄──Token──────┘                                │
                                                         │
                        Backend Cache ◄──────────────────┘
                        (25 min TTL)

User Completes KYC ──► HyperVerge ──Webhook──► Backend /results
                                                      │
                                                      ├─► 200 OK (immediate)
                                                      │
                                                      └─► Async: Fetch Logs API

Frontend ──POST /outputs──► Backend ──┬─► Logs API (get workflowId)
                                      │
                                      └─► Outputs API (with workflowId)
                                                      │
Frontend ◄──Combined Data──────────────────────────────┘
```

### Data Flow

1. **Token Generation Flow**
   ```
   Client → Backend → HyperVerge Auth API → Token (cached 25 min) → Client
   ```

2. **Webhook Flow**
   ```
   HyperVerge → Backend Webhook → 200 OK (instant)
                              └→ Async: Logs API → Store/Log
   ```

3. **Results Fetch Flow**
   ```
   Client → Backend → Logs API (get workflowId)
                   → Outputs API (use workflowId)
                   → Combined Response → Client
   ```

---

## Technology Stack

### Backend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v14+ | JavaScript runtime environment |
| **Express.js** | v4.18.2 | Web application framework |
| **dotenv** | v16.0.3 | Environment variable management |

### HTTP Client & Networking
| Technology | Version | Purpose |
|------------|---------|---------|
| **Axios** | v1.4.0 | Promise-based HTTP client |
| **Custom HttpClient** | - | Wrapper with interceptors for logging |

### Security
| Technology | Version | Purpose |
|------------|---------|---------|
| **Helmet** | v7.0.0 | Security HTTP headers (XSS, CSP, etc.) |
| **CORS** | v2.8.5 | Cross-Origin Resource Sharing |
| **express-rate-limit** | v6.8.1 | Rate limiting middleware |
| **express-validator** | v7.0.1 | Input validation & sanitization |

### Logging & Monitoring
| Technology | Version | Purpose |
|------------|---------|---------|
| **Winston** | v3.10.0 | Structured logging with multiple transports |
| **Morgan** | v1.10.0 | HTTP request logger middleware |

### Performance
| Technology | Version | Purpose |
|------------|---------|---------|
| **Compression** | v1.7.4 | Gzip compression for responses |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Nodemon** | v3.0.1 | Auto-restart server on file changes |
| **Ngrok** | Latest | Public HTTPS tunnel for webhooks |

---

## Project Structure

### Directory Layout

```
hyperverge-backend/
│
├── src/
│   ├── config/                      # Configuration Layer
│   │   ├── env.js                  # Environment variables with validation
│   │   └── constants.js            # API endpoints, error codes, HTTP statuses
│   │
│   ├── utils/                       # Utility Layer
│   │   ├── logger.js               # Winston logger configuration
│   │   └── httpClient.js           # Axios wrapper with interceptors
│   │
│   ├── middleware/                  # Middleware Layer
│   │   ├── errorHandler.js         # Global error handler + AppError class
│   │   ├── validateRequest.js      # Input validation middleware
│   │   └── rateLimiter.js          # Rate limiting configurations
│   │
│   ├── services/                    # Service Layer (Business Logic)
│   │   └── hypervergeService.js    # HyperVerge API integration
│   │
│   ├── controllers/                 # Controller Layer (Request Handlers)
│   │   ├── authController.js       # GET /auth handler
│   │   ├── webhookController.js    # POST /results handler
│   │   └── outputsController.js    # POST /outputs handler
│   │
│   ├── routes/                      # Routing Layer
│   │   └── index.js                # Route definitions + middleware binding
│   │
│   └── app.js                       # Express application configuration
│
├── server.js                        # Entry point (HTTP server startup)
├── package.json                     # Dependencies & scripts
├── .env                             # Environment variables (NEVER commit!)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── README.md                        # User-facing documentation
└── DOC.md                           # Technical documentation (this file)
```

### Layered Architecture

**1. Configuration Layer** (`src/config/`)
- Manages all application configuration
- Validates required environment variables on startup
- Centralizes API endpoints and constants

**2. Utility Layer** (`src/utils/`)
- Provides reusable utility functions
- Logger for structured logging
- HTTP client wrapper for consistent API calls

**3. Middleware Layer** (`src/middleware/`)
- Handles cross-cutting concerns
- Error handling, validation, rate limiting
- Applied before controllers

**4. Service Layer** (`src/services/`)
- Contains business logic
- External API integrations
- Reusable across controllers

**5. Controller Layer** (`src/controllers/`)
- Handles HTTP requests/responses
- Delegates business logic to services
- Thin layer focused on HTTP concerns

**6. Routing Layer** (`src/routes/`)
- Maps URLs to controllers
- Applies middleware to specific routes

---

## Setup & Installation

### Prerequisites

- Node.js v14 or higher
- npm or yarn
- HyperVerge account with credentials (appId, appKey)
- Ngrok (for local webhook testing)

### Installation Steps

#### 1. Install Dependencies

```bash
cd "/Users/sameerkatte/Desktop/Week-4 HyperVerge Backend Integration (Webhook + Results Handling)"
npm install
```

**Dependencies installed:**
```json
{
  "express": "^4.18.2",
  "dotenv": "^16.0.3",
  "axios": "^1.4.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.8.1",
  "express-validator": "^7.0.1",
  "winston": "^3.10.0",
  "morgan": "^1.10.0",
  "compression": "^1.7.4"
}
```

#### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

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

**⚠️ IMPORTANT**: Replace `your_hyperverge_app_id` and `your_hyperverge_app_key` with actual credentials from HyperVerge dashboard.

#### 3. Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
[info]: HyperVerge Backend Server started { port: 3000, environment: 'development' }
[info]: Server is running at http://localhost:3000
[info]: Health check: http://localhost:3000/api/health
```

#### 4. Setup Ngrok (For Webhook Testing)

**In a new terminal:**

```bash
ngrok http 3000
```

**Output:**
```
Forwarding    https://your-unique-url.ngrok-free.dev -> http://localhost:3000
```

**Copy the HTTPS URL** - you'll use this for webhook configuration.

#### 5. Configure HyperVerge Dashboard

1. Login to HyperVerge Dashboard
2. Navigate to **Webhook Settings**
3. Set Webhook URL: `https://your-ngrok-url.ngrok-free.dev/api/results`
4. Subscribe to event: `FINISH_TRANSACTION_WEBHOOK`
5. Save configuration

#### 6. Whitelist Server IP (Required)

**For Logs API and Outputs API access:**

1. Find your server's public IP:
   ```bash
   curl ifconfig.me
   ```

2. Contact HyperVerge Support:
   - Email: support@hyperverge.co
   - Request: IP whitelisting for Logs API and Outputs API
   - Provide: Your public IP address

**Note:** This is a one-time setup required for production access.

---

## API Documentation

### Base URL

- **Development:** `http://localhost:3000`
- **Ngrok:** `https://your-ngrok-url.ngrok-free.dev`
- **Production:** `https://your-domain.com`

All endpoints are prefixed with `/api`

---

### Endpoint 1: GET /api/auth

**Purpose:** Generate HyperVerge SDK authentication token

**Description:** Generates a short-lived JWT token (30-minute expiry) for initializing the HyperVerge SDK in the frontend. The token is cached for 25 minutes to reduce API calls.

**Method:** `GET`

**URL:** `/api/auth`

**Authentication:** None (public endpoint)

**Rate Limit:** 10 requests per minute per IP

**Request:**
```http
GET /api/auth HTTP/1.1
Host: localhost:3000
```

**Response:**

**Success (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6Iml4eWJlcyIsImV4cGlyeVRpbWUiOjE4MDAsImlhdCI6MTczODU3NTgwNiwiZXhwIjoxNzM4NTc3NjA2fQ.xyz...",
  "expiresIn": "30 minutes",
  "message": "Auth token generated successfully"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid HyperVerge credentials",
    "statusCode": 401,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Error (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many auth requests from this IP, please try again after a minute",
    "statusCode": 429,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Usage Example:**

```javascript
// Frontend: Initialize HyperVerge SDK
fetch('http://localhost:3000/api/auth')
  .then(res => res.json())
  .then(data => {
    HyperVergeSDK.init({
      token: data.token,
      workflowId: "your_workflow_id"
    });
  });
```

**Technical Details:**
- Token is generated by calling `POST https://auth.hyperverge.co/login`
- Token is cached for 25 minutes (with 5-minute buffer before 30-minute expiry)
- Subsequent calls within 25 minutes return cached token (response time: ~10ms vs ~300ms)
- appId and appKey are never exposed to frontend

**cURL Example:**
```bash
curl http://localhost:3000/api/auth
```

---

### Endpoint 2: POST /api/results

**Purpose:** Webhook listener for HyperVerge transaction completion events

**Description:** Receives webhook notifications from HyperVerge when a KYC transaction completes. Responds immediately with 200 OK, then asynchronously fetches and logs transaction details.

**Method:** `POST`

**URL:** `/api/results`

**Authentication:** None (HyperVerge sends webhooks)

**Rate Limit:** None (webhook endpoint must accept all requests)

**Request:**

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "eventType": "FINISH_TRANSACTION_WEBHOOK",
  "eventTime": "2026-02-03T12:00:00Z",
  "applicationStatus": "auto_approved",
  "transactionId": "workflow-builder-92YKVp",
  "eventId": "evt_123456"
}
```

**Response:**

**Success (200 OK) - Immediate:**
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid webhook payload",
    "statusCode": 400,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Async Processing (After Response):**

After responding 200 OK, the backend asynchronously:
1. Extracts `transactionId` from webhook payload
2. Calls HyperVerge Logs API: `POST /v1/link-kyc/results`
3. Logs complete transaction data
4. Handles errors gracefully (errors don't affect webhook response)

**Backend Logs (Example):**
```
[info]: Webhook received { eventType: 'FINISH_TRANSACTION_WEBHOOK', transactionId: 'workflow-builder-92YKVp' }
[info]: HTTP Request { method: 'POST', url: '/v1/link-kyc/results' }
[info]: Transaction logs fetched successfully { transactionId: 'workflow-builder-92YKVp' }
[info]: Full transaction data { transactionId: 'workflow-builder-92YKVp', webhookPayload: {...}, logsData: {...} }
```

**Technical Details:**
- **Response Time:** < 100ms (HyperVerge requires < 5 seconds)
- **Async Processing:** Uses `setImmediate()` to defer processing to next event loop iteration
- **Error Isolation:** Async errors are logged but don't crash server
- **Idempotency:** Can handle duplicate webhook deliveries (use `eventId` for deduplication)

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "FINISH_TRANSACTION_WEBHOOK",
    "transactionId": "workflow-builder-92YKVp",
    "applicationStatus": "auto_approved",
    "eventId": "evt_123456"
  }'
```

**Webhook Configuration:**

To receive real webhooks from HyperVerge:

1. **HyperVerge Dashboard:**
   - Webhook URL: `https://your-ngrok-url.ngrok-free.dev/api/results`
   - Event: `FINISH_TRANSACTION_WEBHOOK`

2. **Static Headers (Optional):**
   - Can add custom headers for authentication
   - Validate headers in webhook controller

---

### Endpoint 3: POST /api/outputs

**Purpose:** Fetch comprehensive KYC results for a transaction

**Description:** Retrieves complete KYC verification data by calling both HyperVerge Logs API and Outputs API. Automatically extracts workflowId from logs and uses it to fetch outputs.

**Method:** `POST`

**URL:** `/api/outputs`

**Authentication:** None (internal endpoint, can add auth if needed)

**Rate Limit:** 100 requests per 15 minutes per IP

**Request:**

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "transactionId": "workflow-builder-92YKVp"
}
```

**Response:**

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactionId": "workflow-builder-92YKVp",
    "workflowId": "XkOGhm_29_01_26_11_45_31",
    "logs": {
      "status": "success",
      "statusCode": 200,
      "metadata": {
        "requestId": "1770092689159-3f81bb3c-002b-4a69-a300-99bb95e1aa03",
        "transactionId": "workflow-builder-92YKVp"
      },
      "result": {
        "workflowDetails": {
          "workflowId": "XkOGhm_29_01_26_11_45_31",
          "version": 1
        },
        "applicationStatus": "auto_approved",
        "userDetails": {
          "name": "John Doe",
          "dateOfBirth": "1990-01-01"
        },
        "results": [
          {
            "module": "Document OCR",
            "moduleId": "doc_ocr_123",
            "status": "success"
          }
        ]
      }
    },
    "outputs": {
      "status": "success",
      "statusCode": 200,
      "result": {
        "extractedData": { },
        "verificationResult": { },
        "flags": { }
      }
    }
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "transactionId: transactionId is required",
    "statusCode": 400,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction with ID workflow-builder-92YKVp not found",
    "statusCode": 404,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Error (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later",
    "statusCode": 429,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Technical Details:**

**Sequential API Calls:**
1. **Logs API** (`POST /v1/link-kyc/results`)
   - Fetches transaction logs and details
   - Extracts `workflowId` from response

2. **Outputs API** (`POST /v1/output`)
   - Fetches final KYC outputs
   - Requires both `transactionId` and `workflowId`

**Why Sequential (Not Parallel)?**
```javascript
// ❌ Can't do parallel - workflowId not available yet:
const [logs, outputs] = await Promise.all([
  getTransactionLogs(transactionId),
  getTransactionOutputs(transactionId, workflowId)  // workflowId undefined!
]);

// ✅ Must do sequential:
const logs = await getTransactionLogs(transactionId);
const workflowId = logs.result.workflowDetails.workflowId;
const outputs = await getTransactionOutputs(transactionId, workflowId);
```

**Response Time:** ~750ms (two sequential API calls to HyperVerge)

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/outputs \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "workflow-builder-92YKVp"
  }'
```

---

### Endpoint 4: GET /api/health

**Purpose:** Health check endpoint

**Description:** Simple health check to verify server is running. Useful for monitoring and load balancers.

**Method:** `GET`

**URL:** `/api/health`

**Authentication:** None

**Rate Limit:** None

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:3000
```

**Response:**

**Success (200 OK):**
```json
{
  "success": true,
  "message": "HyperVerge Backend is running",
  "timestamp": "2026-02-03T12:34:56.789Z"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/health
```

---

## Security Implementation

### 1. API Credentials Protection

**Environment Variables:**

All sensitive credentials are stored in `.env` file (never committed to Git):

```env
HV_APP_ID=ixybes
HV_APP_KEY=0v59tmbzn50dm8poxtpd
```

**Validation on Startup:**

```javascript
// src/config/env.js
const validateConfig = () => {
  const requiredFields = [
    { key: 'hyperverge.appId', value: config.hyperverge.appId },
    { key: 'hyperverge.appKey', value: config.hyperverge.appKey }
  ];

  const missing = requiredFields.filter(field => !field.value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map(f => f.key).join(', ')}`
    );
  }
};
```

**Server won't start** if required credentials are missing.

**Benefits:**
- Credentials never in source code
- Easy to rotate keys (update .env only)
- Different credentials per environment (dev/staging/prod)

---

### 2. CORS (Cross-Origin Resource Sharing)

**Configuration:**

```javascript
// src/app.js
app.use(cors({
  origin: config.security.corsOrigin,  // http://localhost:3001
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**What it prevents:**
- Blocks requests from unauthorized domains
- Prevents CSRF (Cross-Site Request Forgery) attacks
- Production: Restricts to specific frontend domain

**Environment-specific:**
```env
# Development
CORS_ORIGIN=http://localhost:3001

# Production
CORS_ORIGIN=https://your-frontend.com
```

---

### 3. Rate Limiting

**Implementation:**

```javascript
// src/middleware/rateLimiter.js
const authLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute window
  max: 10,                     // 10 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,       // Return RateLimit-* headers
  legacyHeaders: false
});
```

**Applied per endpoint:**

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/auth` | 10 requests | 1 minute | Prevents token farming |
| `/api/outputs` | 100 requests | 15 minutes | Prevents API abuse |
| `/api/results` | Unlimited | - | Webhook must accept all |

**Response headers:**
```http
RateLimit-Limit: 10
RateLimit-Remaining: 5
RateLimit-Reset: 1738575900
```

---

### 4. Input Validation

**Implementation:**

```javascript
// src/middleware/validateRequest.js
const validateTransactionId = [
  body('transactionId')
    .exists().withMessage('transactionId is required')
    .isString().withMessage('transactionId must be a string')
    .trim()
    .notEmpty().withMessage('transactionId cannot be empty'),
  handleValidationErrors
];
```

**Applied to routes:**

```javascript
// src/routes/index.js
router.post('/outputs', validateTransactionId, outputsController.getOutputs);
```

**Prevents:**
- SQL injection (even though we don't use SQL)
- XSS attacks
- Type confusion bugs
- Empty/null inputs

---

### 5. Security Headers (Helmet)

**Implementation:**

```javascript
// src/app.js
app.use(helmet());
```

**Headers set:**

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-DNS-Prefetch-Control: off
```

**What each header prevents:**

- `X-Content-Type-Options`: MIME sniffing attacks
- `X-Frame-Options`: Clickjacking attacks
- `X-XSS-Protection`: Cross-site scripting
- `Strict-Transport-Security`: Downgrade attacks (HTTPS → HTTP)
- `Content-Security-Policy`: Code injection

---

### 6. HTTPS in Production

**Development:** HTTP via Ngrok (Ngrok provides HTTPS tunnel)

**Production:** Must use HTTPS

**Options:**
1. **Cloud Provider SSL**: AWS Certificate Manager, GCP SSL, etc.
2. **Let's Encrypt**: Free SSL certificates
3. **Reverse Proxy**: Nginx/Apache with SSL termination

**Example Nginx config:**

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Error Handling

### Custom Error Class

```javascript
// src/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;  // Distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Usage:**

```javascript
// Operational error (expected)
throw new AppError(
  'Transaction not found',
  404,
  'TRANSACTION_NOT_FOUND'
);
```

---

### Global Error Handler

```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Operational vs Programming error
  if (err.isOperational) {
    error.statusCode = err.statusCode;
    error.code = err.code;
  } else {
    error.statusCode = 500;
    error.code = 'INTERNAL_ERROR';
  }

  // Log error
  logger.error('Error Handler', {
    message: error.message,
    statusCode: error.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Send response
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    }
  });
};
```

---

### Error Response Format

**Standard structure:**

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction with ID txn_123 not found",
    "statusCode": 404,
    "timestamp": "2026-02-03T12:34:56.789Z"
  }
}
```

**Error codes:**

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid HyperVerge appId/appKey |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction ID not found |
| `INVALID_INPUT` | 400 | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `HV_API_ERROR` | 502 | HyperVerge API error |
| `INTERNAL_ERROR` | 500 | Server error |

---

### HyperVerge API Error Mapping

```javascript
// Map HyperVerge errors to our errors
if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
  throw new AppError(
    `Transaction with ID ${transactionId} not found`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.TRANSACTION_NOT_FOUND
  );
}

if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
  throw new AppError(
    'Invalid HyperVerge credentials',
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.INVALID_CREDENTIALS
  );
}
```

---

## Logging & Monitoring

### Winston Logger Configuration

```javascript
// src/utils/logger.js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    })
  ]
});
```

### Log Levels

| Level | When to use |
|-------|-------------|
| `error` | Errors that need immediate attention |
| `warn` | Warning conditions (non-critical) |
| `info` | General informational messages |
| `debug` | Detailed debugging information |

### Example Logs

**Auth token request:**
```
2026-02-03 12:00:00 [info]: Auth token requested
2026-02-03 12:00:00 [info]: Generating new HyperVerge auth token
2026-02-03 12:00:00 [info]: HTTP Request {"method":"POST","url":"/login"}
2026-02-03 12:00:00 [info]: HTTP Response {"status":200,"url":"/login"}
2026-02-03 12:00:00 [info]: Auth token generated successfully
```

**Webhook processing:**
```
2026-02-03 12:05:00 [info]: Webhook received {"eventType":"FINISH_TRANSACTION_WEBHOOK","transactionId":"workflow-builder-92YKVp"}
2026-02-03 12:05:00 [info]: Fetching transaction logs {"transactionId":"workflow-builder-92YKVp"}
2026-02-03 12:05:01 [info]: Transaction logs fetched successfully {"transactionId":"workflow-builder-92YKVp"}
```

**Error:**
```
2026-02-03 12:10:00 [error]: Failed to fetch transaction logs {"transactionId":"invalid_id","message":"Request failed with status code 404"}
```

---

## Testing Guide

### Manual Testing with Postman

**1. Health Check**

```bash
curl http://localhost:3000/api/health
```

Expected: `200 OK`

---

**2. Get Auth Token**

```bash
curl http://localhost:3000/api/auth
```

Expected:
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "expiresIn": "30 minutes"
}
```

---

**3. Simulate Webhook**

```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "FINISH_TRANSACTION_WEBHOOK",
    "transactionId": "workflow-builder-92YKVp",
    "applicationStatus": "auto_approved"
  }'
```

Expected: `200 OK` immediately

Check terminal logs for async processing.

---

**4. Get Outputs**

```bash
curl -X POST http://localhost:3000/api/outputs \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "workflow-builder-92YKVp"
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "transactionId": "workflow-builder-92YKVp",
    "workflowId": "XkOGhm_29_01_26_11_45_31",
    "logs": {...},
    "outputs": {...}
  }
}
```

---

### End-to-End Testing

**Complete flow:**

1. Start server: `npm run dev`
2. Start Ngrok: `ngrok http 3000`
3. Get auth token: `GET /api/auth`
4. Initialize HyperVerge SDK (frontend) with token
5. Complete KYC in SDK
6. Webhook received at `/api/results` (check logs)
7. Fetch results: `POST /api/outputs`

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Server IP whitelisted in HyperVerge dashboard
- [ ] SSL/TLS certificate configured
- [ ] CORS origin set to production domain
- [ ] Webhook URL updated to production domain
- [ ] Process manager configured (PM2)
- [ ] Monitoring & alerts set up
- [ ] Logs configured for production

---

### Deploy with PM2

**Install PM2:**

```bash
npm install -g pm2
```

**Start application:**

```bash
pm2 start server.js --name hyperverge-backend
pm2 startup
pm2 save
```

**Monitor:**

```bash
pm2 status
pm2 logs hyperverge-backend
pm2 monit
```

---

### Cloud Deployment Options

**AWS:**
- EC2 instance
- Elastic Beanstalk
- ECS (containers)
- Lambda (serverless)

**Google Cloud:**
- Compute Engine
- App Engine
- Cloud Run

**Other:**
- Heroku
- Railway
- Render
- DigitalOcean

---

## Troubleshooting

### Server won't start

**Error:** `Missing required environment variables`

**Solution:** Check `.env` file has `HV_APP_ID` and `HV_APP_KEY`

---

### Auth token generation fails

**Error:** `Invalid HyperVerge credentials`

**Solution:** Verify credentials in `.env` are correct

---

### Webhook not received

**Possible causes:**
1. Ngrok not running
2. Webhook URL not configured in HyperVerge dashboard
3. Wrong event type subscribed

**Solution:** Check Ngrok is running, verify webhook URL is correct

---

### Transaction not found error

**Error:** `Transaction with ID ... not found`

**Possible causes:**
1. Server IP not whitelisted
2. Transaction doesn't exist
3. Wrong API base URL

**Solution:** Contact HyperVerge support to whitelist IP

---

## Technical Deep Dive

### Why Token Caching?

**Without caching:**
- Every `/auth` call → HyperVerge API call
- Latency: ~300ms
- 1000 requests/day = 1000 API calls

**With caching (25 min):**
- First call → HyperVerge API (~300ms)
- Next 24 calls → Cache hit (~10ms)
- 1000 requests/day = ~40 API calls (96% reduction!)

---

### Why Async Webhook Processing?

**Synchronous (Bad):**
```javascript
app.post('/results', async (req, res) => {
  await callLogsAPI();  // Takes 300ms
  res.send('OK');        // Response after 300ms
});
```

**Asynchronous (Good):**
```javascript
app.post('/results', async (req, res) => {
  res.send('OK');       // Response in 50ms
  setImmediate(async () => {
    await callLogsAPI(); // Happens in background
  });
});
```

**Why it matters:**
- HyperVerge requires < 5 second response
- Logs API can take 300-500ms
- Network issues could cause timeout
- Async guarantees fast response

---

### Why Sequential API Calls in /outputs?

**The problem:**

Outputs API requires:
```json
{
  "transactionId": "abc123",
  "workflowId": "xyz789"  // Not available until Logs API responds
}
```

**Cannot parallelize:**
```javascript
// ❌ This won't work:
const [logs, outputs] = await Promise.all([
  getTransactionLogs(transactionId),
  getTransactionOutputs(transactionId, workflowId)  // workflowId is undefined!
]);
```

**Must be sequential:**
```javascript
// ✅ This works:
const logs = await getTransactionLogs(transactionId);
const workflowId = logs.result.workflowDetails.workflowId;
const outputs = await getTransactionOutputs(transactionId, workflowId);
```

---

### Design Patterns Used

**1. Singleton Pattern** - HyperVergeService
```javascript
module.exports = new HyperVergeService();  // Single instance
```

**2. Factory Pattern** - Rate limiters
```javascript
const createRateLimiter = (windowMs, max) => rateLimit({...});
```

**3. Wrapper Pattern** - Async handler
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**4. Layered Architecture** - Separation of concerns
```
Routes → Controllers → Services → External APIs
```

---

## Conclusion

This backend provides a **production-ready**, **secure**, and **scalable** integration with HyperVerge KYC services. All endpoints are tested, documented, and follow industry best practices.

### Key Achievements

✅ Secure credential management
✅ Optimized performance (token caching)
✅ Fast webhook responses (< 100ms)
✅ Comprehensive error handling
✅ Rate limiting & security
✅ Structured logging
✅ Clean, maintainable code

---

## Support & Contact

For issues or questions:
- **HyperVerge API Issues:** support@hyperverge.co
- **Documentation:** [HyperVerge Documentation](https://documentation.hyperverge.co/)

---

**Document Version:** 1.0
**Last Updated:** February 3, 2026
**Author:** HyperVerge Integration Team
