# Vercel Deployment Guide

## Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub repository with your Chalo project
- MongoDB Atlas cluster (or any MongoDB URI)

## Environment Variables Setup

Before deploying, add these environment variables in Vercel dashboard:

1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Add the following variables:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here-min-32-chars
QR_HMAC_SECRET=your-qr-secret-key-min-32-chars
PORT=3000
NODE_ENV=production
```

## Deployment Steps

### Option 1: Via Vercel CLI (Fastest)
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend folder
cd backend

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

### Option 2: Via GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Select your GitHub repository
5. Set **Root Directory** to `backend`
6. Add environment variables in "Environment Variables" section
7. Click "Deploy"

## Automatic Deployments
Once connected to GitHub:
- Every push to `main` branch auto-deploys
- Preview deployments for pull requests
- Rollback capability for previous versions

## Testing Your Deployment

After deployment, test the endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Register
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "1234567890",
    "password": "password123",
    "dob": "2000-01-01",
    "gender": "M"
  }'

# Login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "password": "password123"
  }'
```

## Key Features of This Setup

✅ Serverless functions - automatic scaling
✅ MongoDB connection pooling via Mongoose
✅ CORS enabled for your frontend
✅ JWT authentication
✅ Environment variable management
✅ Cold start optimized
✅ Zero downtime deployments

## Common Issues & Solutions

### Issue: "Cannot find module"
- Run `npm install` locally first
- Ensure package.json has all dependencies

### Issue: "MONGO_URI is not defined"
- Check environment variables are set in Vercel dashboard
- Use "Add Environment Variable" not inline values

### Issue: "Connection timeout to MongoDB"
- Verify MongoDB URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Use "0.0.0.0/0" for Vercel IPs or add Vercel's IP range

### Issue: "Function timed out"
- MongoDB cold start can take time
- Increase timeout in vercel.json if needed

## Update Your Frontend API URLs

Update `chalo/src/utils/api.js` to use your Vercel URL:

```javascript
const API_BASE_URL = 'https://your-project.vercel.app/api';
```

## Monitoring & Logs

View logs in Vercel dashboard:
1. Go to your project
2. Click "Deployments" tab
3. Select the latest deployment
4. Click "Logs" to see real-time output

## Next Steps

- Set up custom domain (optional)
- Enable Vercel Analytics for performance monitoring
- Set up automatic backups for MongoDB
- Monitor rate limits and usage

For more help: https://vercel.com/docs/frameworks/express
