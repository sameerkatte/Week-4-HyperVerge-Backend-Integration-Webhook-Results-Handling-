# Ngrok Setup & URL Configuration

## 🌐 Why Ngrok?

HyperVerge servers need a **public URL** to send webhooks to your backend. Since your backend runs on `localhost:3000`, it's not accessible from the internet. Ngrok creates a secure tunnel that makes your local server publicly accessible.

---

## 📋 URL Configuration Summary

### Your Ngrok URL
```
https://quaquaversal-battlemented-clarine.ngrok-free.dev
```

### Where to Use Each URL

| Component | URL to Use | Why |
|-----------|------------|-----|
| **Frontend → Backend (Auth)** | Ngrok URL | Consistent with webhook setup |
| **HyperVerge → Backend (Webhook)** | Ngrok URL | **REQUIRED** - Must be public |
| **Browser Access (Frontend)** | Both work | localhost:3000 or ngrok URL |
| **HyperVerge Dashboard Webhook** | Ngrok URL | **REQUIRED** - Configure this |

---

## 🚀 Complete Setup Steps

### Step 1: Start Your Backend
```bash
npm run dev
```
Server running at: `http://localhost:3000`

### Step 2: Start Ngrok (if not already running)
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://quaquaversal-battlemented-clarine.ngrok-free.dev -> http://localhost:3000
```

### Step 3: Configure HyperVerge Dashboard
1. Login to HyperVerge One Dashboard
2. Go to **Webhooks** section
3. Set webhook URL to:
   ```
   https://quaquaversal-battlemented-clarine.ngrok-free.dev/api/results
   ```
4. Subscribe to: `FINISH_TRANSACTION_WEBHOOK`
5. Save configuration

### Step 4: Access Frontend
You can use either:
- **http://localhost:3000** (local access)
- **https://quaquaversal-battlemented-clarine.ngrok-free.dev** (public access)

### Step 5: Configure Frontend
The frontend is now pre-configured with your ngrok URL:
- Backend URL: `https://quaquaversal-battlemented-clarine.ngrok-free.dev`
- Workflow ID: `XkOGhm_29_01_26_11_45_31`

---

## 🔄 Complete Flow with Ngrok

```
┌─────────────────────┐
│  User Opens Browser │
│  localhost:3000  OR │
│  ngrok URL          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Frontend Calls Backend                 │
│  GET https://your-ngrok-url/api/auth    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Backend (localhost:3000)               │
│  ← Ngrok tunnels request                │
│  → Returns auth token                   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Frontend Launches HyperVerge SDK       │
│  User completes KYC                     │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  HyperVerge Sends Webhook               │
│  POST https://your-ngrok-url/api/results│
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Backend Receives Webhook               │
│  ← Ngrok tunnels webhook                │
│  → Logs transaction data                │
└─────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] Backend server running: `npm run dev`
- [ ] Ngrok tunnel active: `ngrok http 3000`
- [ ] Ngrok URL matches in frontend: Check index.html backend URL field
- [ ] HyperVerge dashboard webhook configured: `{ngrok-url}/api/results`
- [ ] CORS includes ngrok URL in `.env`:
  ```env
  CORS_ORIGIN=http://localhost:3001, http://localhost:3000, https://quaquaversal-battlemented-clarine.ngrok-free.dev
  ```

---

## 🧪 Testing the Complete Flow

### Test 1: Auth Token via Ngrok
```bash
curl https://quaquaversal-battlemented-clarine.ngrok-free.dev/api/auth
```

Expected response:
```json
{
  "success": true,
  "token": "Bearer eyJhbGci...",
  "expiresIn": "30 minutes"
}
```

### Test 2: Frontend Access via Ngrok
Open in browser:
```
https://quaquaversal-battlemented-clarine.ngrok-free.dev
```

Should show the KYC verification page.

### Test 3: Webhook Simulation
```bash
curl -X POST https://quaquaversal-battlemented-clarine.ngrok-free.dev/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "FINISH_TRANSACTION_WEBHOOK",
    "transactionId": "test_txn_123",
    "applicationStatus": "auto_approved",
    "eventId": "evt_test_456",
    "eventTime": "2026-02-03T12:00:00Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

Check backend logs - you should see webhook processing logs.

---

## 🔧 Troubleshooting

### Issue: "Ngrok URL not working"
**Solution**:
1. Check if ngrok is running: Look for "Forwarding" line in ngrok terminal
2. Verify URL hasn't changed (free ngrok URLs change on restart)
3. Update frontend if URL changed

### Issue: "Webhooks not received"
**Solution**:
1. Verify webhook URL in HyperVerge dashboard matches your ngrok URL
2. Check ngrok terminal for incoming webhook requests
3. Verify backend server is running
4. Check backend logs for webhook processing

### Issue: "CORS error when using ngrok URL"
**Solution**:
1. Add ngrok URL to `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000,https://your-ngrok-url.ngrok-free.dev
   ```
2. Restart backend server
3. Clear browser cache

### Issue: "Ngrok URL changes every time"
**Solution**:
- Free ngrok URLs change on restart
- Options:
  1. Update frontend URL each time
  2. Use ngrok paid plan for static domain
  3. Use localhost:3000 for frontend testing (webhooks still need ngrok)

---

## 💡 Pro Tips

### Tip 1: Keep Ngrok Running
Don't close the ngrok terminal window. If you do, the URL becomes invalid.

### Tip 2: Monitor Ngrok Traffic
Ngrok provides a web interface at:
```
http://127.0.0.1:4040
```
Visit this to see all requests going through the tunnel.

### Tip 3: Ngrok Config File
Create `~/.ngrok2/ngrok.yml` for permanent settings:
```yaml
tunnels:
  hyperverge:
    proto: http
    addr: 3000
```

Then start with:
```bash
ngrok start hyperverge
```

### Tip 4: Multiple Terminals
Keep organized:
- Terminal 1: Backend server (`npm run dev`)
- Terminal 2: Ngrok tunnel (`ngrok http 3000`)
- Terminal 3: Free for testing commands

---

## 📱 Testing from Mobile Device

With ngrok, you can test from your phone:

1. Make sure ngrok is running
2. Open your ngrok URL on phone browser:
   ```
   https://quaquaversal-battlemented-clarine.ngrok-free.dev
   ```
3. Complete KYC verification on mobile
4. Webhooks will still work!

---

## 🔐 Security Note

**Important**: Ngrok URLs are publicly accessible. Don't expose sensitive data.

For production:
- Use a proper domain with SSL
- Deploy to cloud (AWS, GCP, Heroku, Railway)
- Configure firewall rules
- Enable rate limiting

---

## 📊 Current Configuration

Your current setup:
```
Backend Server:    http://localhost:3000
Ngrok Tunnel:      https://quaquaversal-battlemented-clarine.ngrok-free.dev
Frontend Access:   Both URLs work
Backend URL (SDK): https://quaquaversal-battlemented-clarine.ngrok-free.dev (pre-configured)
Webhook URL:       https://quaquaversal-battlemented-clarine.ngrok-free.dev/api/results
```

---

## ✅ You're All Set!

Your frontend is now configured to use the ngrok URL by default. This ensures:
1. ✅ Auth token fetching works
2. ✅ Webhooks can reach your backend
3. ✅ You can test from any device
4. ✅ Complete end-to-end flow works

Start testing:
```bash
# Terminal 1
npm run dev

# Terminal 2 (if not already running)
ngrok http 3000

# Browser
Open: http://localhost:3000
(or your ngrok URL)
```

**Happy Testing!** 🚀
