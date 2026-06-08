# Vercel Backend Debugging Guide

## Quick Fix Checklist

- [ ] Step 1: Check Vercel Logs
- [ ] Step 2: Verify Environment Variables  
- [ ] Step 3: Test Health Endpoint
- [ ] Step 4: Check MongoDB Connection

---

## Step 1: Check Vercel Logs

**Where to find logs:**
1. Go to https://vercel.com/dashboard
2. Click **chalobackend** project
3. Click **Deployments** tab
4. Click the latest deployment
5. Click **View Logs** (top right)

**What to look for:**
- `MONGO_URI: ✅ SET` or `❌ MISSING` 
- `JWT_SECRET: ✅ SET` or `❌ MISSING`
- `QR_HMAC_SECRET: ✅ SET` or `❌ MISSING`

If any show `❌ MISSING`, go to Step 2.

---

## Step 2: Verify Environment Variables

**Method A: Via Vercel Dashboard**
1. Go to **Settings** → **Environment Variables**
2. Check that all 3 variables exist:
   ```
   MONGO_URI = your_mongodb_connection_string
   JWT_SECRET = your_jwt_secret
   QR_HMAC_SECRET = your_qr_secret
   ```
3. If missing, add them
4. **IMPORTANT: Redeploy** after adding variables

**Method B: Generate Secure Secrets**
If you need new secrets:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate QR_HMAC_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Test Endpoints

After deployment, test these URLs:

### Test 1: Root Endpoint (No Auth Required)
```
GET https://chalobackend.vercel.app/api
```
Should return:
```json
{
  "message": "Chalo Backend API - Test OK",
  "timestamp": "2024-..."
}
```

### Test 2: Health Check
```
GET https://chalobackend.vercel.app/api/health
```
Should return:
```json
{
  "status": "ok",
  "environment": "production",
  "mongo": "✅" or "❌",
  "jwt": "✅" or "❌",
  "qr": "✅" or "❌"
}
```

If all show `❌`, environment variables aren't set.

### Test 3: Register (Auth Test)
```bash
curl -X POST https://chalobackend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9876543210",
    "password": "TestPass123",
    "dob": "2000-01-01",
    "gender": "M"
  }'
```

---

## Step 4: Check MongoDB Connection

**Is MongoDB accessible from Vercel?**

If you're using **MongoDB Atlas** (cloud):
1. Go to MongoDB Atlas → Cluster → Network Access
2. Add Vercel IP: `0.0.0.0/0` (allow all) - NOT recommended for production
3. Better: Use VPN or ask MongoDB support

If using **Local MongoDB**:
- Local MongoDB won't work on Vercel
- Switch to MongoDB Atlas: https://www.mongodb.com/cloud/atlas

---

## Common Error Messages & Fixes

### Error: "MONGO_URI not configured"
**Fix:** Go to Vercel Settings → Environment Variables → Add MONGO_URI

### Error: "JWT_SECRET not configured"
**Fix:** Go to Vercel Settings → Environment Variables → Add JWT_SECRET

### Error: "Cannot connect to MongoDB"
**Causes:**
- MongoDB URI is wrong
- MongoDB Server is not running (local)
- Vercel IP not whitelisted in MongoDB Atlas
- Network timeout

**Fix:**
- Test MongoDB locally first: `mongosh "mongodb://localhost:27017"`
- If using Atlas, whitelist Vercel IPs

### Error: "Route not found" or 404
**Check:** Are you calling `/api/health` or just `/health`?
- Frontend uses: `${API_BASE}/auth/login` (with /api prefix)
- Backend routes are: `/auth/login` (no /api)
- Vercel routing adds the `/api` automatically

---

## Deployment Steps

1. **Add environment variables to Vercel:**
   ```
   MONGO_URI
   JWT_SECRET
   QR_HMAC_SECRET
   ```

2. **Redeploy:**
   ```bash
   git add .
   git commit -m "Fix backend API"
   git push
   ```

3. **Wait for deployment** (1-2 minutes)

4. **Test the health endpoint**

---

## Need Help?

Share the **Vercel logs** with me and I'll help debug!

Logs location: https://chalobackend.vercel.app/_logs?requestId=YOUR_REQUEST_ID
