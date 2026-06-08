# Backend Connection Setup Guide

## Overview
This project has a React Native Expo frontend (`chalo/`) and Express.js backend (`backend/`). Follow these steps to properly connect them.

## Backend Setup

### 1. MongoDB Installation
- Download and install MongoDB from: https://www.mongodb.com/try/download/community
- Start MongoDB service:
  ```bash
  # Windows
  mongod
  ```

### 2. Backend Configuration
Navigate to `backend/` folder:
```bash
cd backend
```

Create or update `.env` file with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chalo
JWT_SECRET=chalo_jwt_secret_key_2024
NODE_ENV=development
```

### 3. Install Backend Dependencies
```bash
npm install
```

### 4. Start Backend Server
```bash
npm run dev
```

You should see:
```
MongoDB connected
Server running on port 5000
```

Test the backend:
```
GET http://localhost:5000/api/health
```

Response should be: `{ "status": "ok" }`

---

## Frontend Setup

### 1. Configuration
The frontend (`chalo/`) is now configured with environment-based API URLs in `.env`:

```
API_ENV=development
API_BASE_LOCAL=http://localhost:5000/api
API_BASE_ANDROID=http://10.0.2.2:5000/api
API_BASE_IOS=http://localhost:5000/api
API_BASE_PRODUCTION=https://chalobackend.vercel.app
```

### 2. API Base URL Selection (Automatic)
The app automatically selects the correct API URL based on platform:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: `http://localhost:5000/api` (if on same network)
- **Production**: `https://chalobackend.vercel.app`

### 3. Start Frontend
```bash
cd chalo
npm install
npm run android
# OR
npm run ios
# OR
npm run web
```

---

## Available Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### QR Codes
- `POST /api/qr/generate` - Generate QR pass
- `POST /api/qr/verify` - Verify QR code
- `GET /api/qr/secret` - Get HMAC secret

### Health Check
- `GET /api/health` - Server status

---

## Environment Configuration

### Development Mode
Set `API_ENV=development` in `chalo/.env` to use local backend.

### Production Mode
Set `API_ENV=production` in `chalo/.env` to use deployed backend.

---

## Troubleshooting

### "Cannot connect to backend"
1. Ensure MongoDB is running: `mongod`
2. Ensure backend is running: `npm run dev` from `backend/` folder
3. Check firewall settings
4. For Android emulator, use `10.0.2.2:5000` not `localhost:5000`

### "MongoDB connection failed"
- Install MongoDB locally or use MongoDB Atlas (cloud)
- Update `MONGO_URI` in `.env`

### "JWT_SECRET not set"
- Ensure `.env` file exists in `backend/` folder
- Restart backend server after updating `.env`

---

## Project Structure
```
Chalo/
├── backend/              # Express.js API server
│   ├── routes/          # API endpoints
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Auth middleware
│   ├── index.js         # Server entry point
│   ├── package.json
│   └── .env             # Backend configuration
│
└── chalo/               # React Native Expo app
    ├── app/             # App screens and routing
    ├── src/
    │   ├── utils/
    │   │   ├── api.js       # API configuration (automatically selects URL)
    │   │   └── authService.js
    │   ├── screens/     # Screen components
    │   └── data/        # Mock data
    ├── package.json
    └── .env             # Frontend configuration
```

---

## Next Steps
1. ✅ Start MongoDB
2. ✅ Start backend server
3. ✅ Start frontend app
4. Test login functionality

All backend connection is now properly configured!
