# HyperKYC Web SDK Integration Guide

## Overview

This guide covers the complete Web SDK integration for HyperKYC verification. The implementation includes:
- Frontend web application with HyperVerge Web SDK v10.0.0
- Backend authentication token generation
- Real-time result handling
- Network inspection capabilities
- Comprehensive debugging tools

---

## Architecture

```
┌─────────────────┐
│  Frontend (Web) │
│  - index.html   │
│  - app.js       │
│  - styles.css   │
└────────┬────────┘
         │
         │ 1. GET /api/auth (fetch token)
         │
┌────────▼────────┐
│  Backend API    │
│  (Express.js)   │
└────────┬────────┘
         │
         │ 2. POST /login
         │
┌────────▼────────────┐
│  HyperVerge Auth    │
│  auth.hyperverge.co │
└─────────────────────┘

User completes KYC ──┐
                     │
            ┌────────▼────────┐
            │  HyperVerge SDK │
            │   (Web v10.0.0) │
            └────────┬────────┘
                     │
                     │ Callback with status
                     │
            ┌────────▼────────┐
            │   Display Result│
            │   to User       │
            └─────────────────┘
```

---

## Quick Start

### 1. Start the Backend Server

```bash
# Navigate to project directory
cd /path/to/project

# Install dependencies (if not already done)
npm install

# Start the server
npm run dev
```

Server will start at: `http://localhost:3000`

### 2. Access the Web Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Configure and Launch

1. **Workflow ID**: Pre-filled with `XkOGhm_29_01_26_11_45_31` (update if needed)
2. **Backend URL**: Pre-filled with `http://localhost:3000`
3. **Show Landing Page**: Checkbox to enable/disable landing page
4. Click **"Start KYC Verification"**

---

## Network Tab Inspection

### Opening DevTools

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)
- Right-click → Inspect

**Firefox:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)

**Safari:**
- Enable Developer Menu: Safari → Preferences → Advanced → Show Develop menu
- Press `Cmd+Option+I`

### What to Observe

Once you click "Start KYC Verification", you'll see the following network calls:

#### 1. **Auth Token Generation**
```
Request:  GET http://localhost:3000/api/auth
Response: {
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. **HyperVerge SDK Initialization**
```
Request:  GET https://hv-web-sdk-cdn.hyperverge.co/hyperverge-web-sdk@10.0.0/src/sdk.min.js
Status:   200 OK
```

#### 3. **Workflow Configuration Fetch**
```
Request:  GET https://ind.idv.hyperverge.co/v1/workflows/{workflowId}
Headers:  Authorization: Bearer {token}
Response: Workflow configuration JSON
```

#### 4. **Document/Face Capture & Upload**
```
Request:  POST https://ind.idv.hyperverge.co/v1/upload
Headers:  Authorization: Bearer {token}
Body:     FormData with captured image
Response: Upload confirmation
```

#### 5. **Liveness Check (if enabled)**
```
Request:  POST https://ind.idv.hyperverge.co/v1/liveness
Body:     Video/image data
Response: Liveness result
```

#### 6. **Transaction Completion**
```
Request:  POST https://ind.idv.hyperverge.co/v1/finish
Response: Final verification status
```

#### 7. **Backend Webhook (Async)**
```
Request:  POST http://localhost:3000/api/results
Body:     {
  "eventType": "FINISH_TRANSACTION_WEBHOOK",
  "transactionId": "txn_...",
  "applicationStatus": "auto_approved"
}
```

---

## SDK Response Statuses

### 1. `auto_approved` ✅
**Meaning**: All verification checks passed successfully.

**Display**:
```
✅ Verification Successful!
Your identity has been verified successfully.
All checks passed. You can proceed with your application.
```

**Next Steps**:
- User can proceed with the application
- Backend receives webhook confirmation
- Transaction data available via GET /api/outputs

---

### 2. `auto_declined` ❌
**Meaning**: Verification failed automated checks.

**Display**:
```
❌ Verification Failed
We were unable to verify your identity.
Please contact support if you believe this is an error.
```

**Common Reasons**:
- Poor document quality
- Document mismatch
- Face mismatch
- Suspected fraud

---

### 3. `needs_review` ⏳
**Meaning**: Ambiguous result requiring manual review.

**Display**:
```
⏳ Verification Under Review
Your application has been flagged for manual review.
We'll notify you once the review is complete. This typically takes 24-48 hours.
```

**Common Reasons**:
- Borderline quality scores
- Partial match on checks
- Configuration requires manual review

---

### 4. `user_cancelled` 🚫
**Meaning**: User exited the flow before completion.

**Display**:
```
🚫 Verification Cancelled
You cancelled the verification process.
You can restart the verification whenever you're ready.
```

**Triggers**:
- User clicks close/back button
- User navigates away from page
- User denies camera permissions

---

### 5. `error` ⚠️
**Meaning**: Technical failure during verification.

**Display**:
```
⚠️ Technical Error
A technical error occurred during verification.
Error Code: 101
Error Message: Unable to fetch workflow
```

**Common Error Codes**:
- `101`: SDK Configuration Error
- `102`: Workflow Input Error
- `103`: User/Network Cancelled
- `106`: Camera Permissions Denied
- `107`: Hardware Error
- `111`: Network Error
- `112`: Signature Failed (potential MITM attack)

---

## Debug Console

The web application includes a built-in debug console at the bottom of the page that shows:

### Log Types

**INFO (Green)** 📘
```
[12:30:45] Fetching auth token from: http://localhost:3000/api/auth
[12:30:46] Auth token fetched successfully
[12:30:46] Token length: 245 characters
```

**SUCCESS (Blue)** ✅
```
[12:30:47] HyperKycConfig created successfully
[12:30:48] SDK launch initiated successfully
```

**WARNING (Yellow)** ⚠️
```
[12:31:15] User CANCELLED the workflow
[12:31:15] Verification NEEDS MANUAL REVIEW
```

**ERROR (Red)** ❌
```
[12:30:50] Failed to fetch auth token: Network error
[12:31:00] SDK Launch Failed: Invalid workflow ID
```

---

## Testing Checklist

### Pre-Launch Checks
- [ ] Backend server is running (`npm run dev`)
- [ ] `.env` file contains correct HV_APP_ID and HV_APP_KEY
- [ ] Workflow ID is correct and exists in HyperVerge dashboard
- [ ] CORS is configured correctly (includes localhost)
- [ ] Browser DevTools Network tab is open

### During Verification
- [ ] Auth token fetched successfully (check Network tab)
- [ ] SDK loads without errors (check Console)
- [ ] Camera permissions granted (if required)
- [ ] Document capture works smoothly
- [ ] Face capture/liveness works smoothly
- [ ] All network requests show 200 OK status

### Post-Verification
- [ ] Correct status displayed (auto_approved/auto_declined/needs_review)
- [ ] Transaction ID shown in result
- [ ] Full response object visible in result details
- [ ] Debug console shows complete flow
- [ ] Webhook received by backend (check server logs)

---

## Common Issues & Troubleshooting

### Issue 1: "Failed to fetch auth token"
**Symptoms**: Error message immediately after clicking "Start KYC Verification"

**Solutions**:
1. Check backend server is running: `http://localhost:3000/api/auth`
2. Verify CORS settings in `.env`:
   ```
   CORS_ORIGIN=http://localhost:3000
   ```
3. Check browser console for CORS errors

---

### Issue 2: "Unable to Fetch workFlow with WorkflowID"
**Symptoms**: SDK error code 101

**Solutions**:
1. Verify workflow ID exists in HyperVerge dashboard
2. Ensure workflow ID matches exactly (case-sensitive)
3. Confirm auth token contains correct appId

---

### Issue 3: "Camera Permissions Denied" (Error 106)
**Symptoms**: SDK cannot access camera

**Solutions**:
1. Click camera icon in browser address bar
2. Select "Allow" for camera permissions
3. Refresh page and try again
4. Check browser settings → Privacy → Camera permissions

---

### Issue 4: "Domain is not CORS whitelisted" (Error 103)
**Symptoms**: Workflow ends immediately with CORS error

**Solutions**:
1. Login to HyperVerge One dashboard
2. Navigate to Settings → CORS Whitelisting
3. Add `http://localhost:3000` to whitelist
4. Save and try again

---

### Issue 5: SDK doesn't load
**Symptoms**: Blank page or "HyperKYCModule is not defined"

**Solutions**:
1. Check internet connection
2. Verify SDK script URL in HTML:
   ```html
   <script src="https://hv-web-sdk-cdn.hyperverge.co/hyperverge-web-sdk@10.0.0/src/sdk.min.js"></script>
   ```
3. Check browser console for script loading errors
4. Try clearing browser cache

---

## Advanced Configuration

### Custom Workflow Inputs

If your workflow requires additional inputs, modify `app.js`:

```javascript
const hyperKycConfig = new HyperKycConfig(
    authToken,
    workflowId,
    transactionId,
    showLandingPage
);

// Add custom inputs
hyperKycConfig.setInputs({
    "custom_field": "custom_value",
    "user_type": "premium"
});

await HyperKYCModule.launch(hyperKycConfig, resultHandler);
```

### Dark Mode Support

Enable dark mode detection:

```javascript
hyperKycConfig.supportDarkMode(true);
```

### Custom Initial Loader Color

Change the initial SDK loader color:

```javascript
hyperKycConfig.setInitialLoaderColor('#ff5733'); // Red loader
```

### Language Configuration

Set default language (if multiple languages configured):

```javascript
hyperKycConfig.setDefaultLangCode('en'); // English
```

---

## Complete Flow Diagram

```
┌─────────────────────┐
│  User Opens Page    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Enter Configuration │
│ - Workflow ID       │
│ - Backend URL       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Click "Start KYC"  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Fetch Auth Token    │
│ GET /api/auth       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Initialize SDK      │
│ HyperKycConfig      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Launch SDK         │
│ HyperKYCModule      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User Completes KYC  │
│ - Doc Capture       │
│ - Face Capture      │
│ - Liveness (if req) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SDK Callback       │
│  - auto_approved    │
│  - auto_declined    │
│  - needs_review     │
│  - user_cancelled   │
│  - error            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Display Result to   │
│ User with Details   │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Backend Receives    │
│ Webhook (Async)     │
│ POST /api/results   │
└─────────────────────┘
```

---

## Files Structure

```
project/
├── public/
│   ├── index.html          # Main web page
│   ├── styles.css          # UI styling
│   └── app.js              # SDK integration logic
├── src/
│   ├── controllers/
│   │   ├── authController.js       # GET /auth endpoint
│   │   ├── webhookController.js    # POST /results webhook
│   │   └── outputsController.js    # POST /outputs endpoint
│   └── app.js              # Express app (serves static files)
└── WEB_SDK_GUIDE.md        # This guide
```

---

## API Endpoints Used

### Frontend Calls Backend
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth` | GET | Fetch 30-minute auth token for SDK |

### SDK Calls HyperVerge
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/workflows/{id}` | GET | Fetch workflow configuration |
| `/v1/upload` | POST | Upload captured documents/face |
| `/v1/liveness` | POST | Perform liveness check |
| `/v1/finish` | POST | Complete transaction |

### HyperVerge Calls Backend (Webhook)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/results` | POST | Notify transaction completion |

---

## Security Best Practices

1. ✅ **Never expose appId/appKey to frontend**
   - Always fetch auth token from backend
   - Token is short-lived (30 minutes)

2. ✅ **Use webhook for decisioning**
   - Don't trust frontend result for business logic
   - Backend webhook provides verified outcome

3. ✅ **Enable CORS whitelisting**
   - Restrict domains in HyperVerge dashboard
   - Only allow production domains

4. ✅ **Monitor for error code 112**
   - Indicates potential MITM attack
   - Consult HyperVerge team before proceeding

---

## Next Steps

1. **Complete a test verification** using the web interface
2. **Inspect all network calls** in DevTools
3. **Test all status scenarios** (approved, declined, review, cancelled, error)
4. **Verify webhook reception** in backend logs
5. **Test GET /api/outputs** to fetch full transaction data
6. **Document your findings** for mentor demo

---

## Support

- **HyperVerge Documentation**: https://documentation.hyperverge.co/sdks/web/
- **Error Codes Reference**: See Integration Guide pages 6-8
- **Backend API Guide**: See DOC.md in project root

---

**Created**: 2026-02-03
**SDK Version**: 10.0.0
**Backend**: Node.js + Express
