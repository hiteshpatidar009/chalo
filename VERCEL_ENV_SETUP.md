# Vercel Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project settings:

### 1. **MONGO_URI** (MongoDB Connection)
```
mongodb+srv://username:password@cluster.mongodb.net/chalo?retryWrites=true&w=majority
```
- Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
- OR local MongoDB with network access

### 2. **JWT_SECRET** (JWT Token Signing)
```
your_jwt_secret_key_change_this_in_production_2024
```
- Use a strong random string
- Command to generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. **QR_HMAC_SECRET** (QR Code Signing)
```
your_qr_hmac_secret_key_change_this_in_production_2024
```
- Use a strong random string  
- Command to generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Steps to Add Environment Variables on Vercel

1. Go to your Vercel Dashboard
2. Select your **chalobackend** project
3. Click **Settings** → **Environment Variables**
4. Add each variable:
   - Key: `MONGO_URI`, Value: `your_connection_string`
   - Key: `JWT_SECRET`, Value: `your_secret`
   - Key: `QR_HMAC_SECRET`, Value: `your_secret`
5. Make sure to select **Production** environment
6. Click **Save**
7. **Redeploy** your project

## Frontend Update

No changes needed - your frontend already uses `https://chalobackend.vercel.app` for production.

## Testing After Deployment

Test the health endpoint:
```
GET https://chalobackend.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "environment": "production"
}
```

## Troubleshooting

### Still getting 500 error?
1. Check Vercel logs: Dashboard → Project → Deployments → Logs
2. Ensure all 3 environment variables are set
3. Redeploy after adding variables

### MongoDB Connection Failed?
- Verify MONGO_URI is correct
- Allow Vercel IP in MongoDB Atlas Network Access
- Check credentials

### JWT_SECRET or QR_HMAC_SECRET not configured?
- These must be set before deployment
- Cannot be undefined
