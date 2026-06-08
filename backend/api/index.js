require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET;

// Log environment check
console.log('[API] ===== STARTUP =====');
console.log('[API] MONGO_URI:', MONGO_URI ? '✅ SET' : '❌ MISSING');
console.log('[API] JWT_SECRET:', JWT_SECRET ? '✅ SET' : '❌ MISSING');
console.log('[API] QR_HMAC_SECRET:', QR_HMAC_SECRET ? '✅ SET' : '❌ MISSING');

// MongoDB Connection
let mongoConnected = false;
const connectDB = async () => {
  if (mongoConnected) return;
  if (!MONGO_URI) throw new Error('MONGO_URI not configured');
  
  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    mongoConnected = true;
    console.log('[API] ✅ MongoDB connected');
  } catch (err) {
    console.error('[API] ❌ MongoDB error:', err.message);
    mongoConnected = false;
    throw err;
  }
};

// Define Models inline (avoids import errors on Vercel)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: String, default: '' },
  gender: { type: String, default: '' },
}, { timestamps: true });

const ScannedTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: String,
  ticketId: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const User = mongoose.model('User', UserSchema);
const ScannedToken = mongoose.model('ScannedToken', ScannedTokenSchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ========== ROUTES ==========

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chalo Backend API ✅',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    mongo: MONGO_URI ? '✅' : '❌',
    jwt: JWT_SECRET ? '✅' : '❌',
    qr: QR_HMAC_SECRET ? '✅' : '❌'
  });
});

// ========== AUTH ROUTES ==========

app.post('/auth/register', async (req, res) => {
  try {
    await connectDB();
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
    
    const { name, phone, password, dob = '', gender = '' } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ error: 'Phone already registered' });
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, password: hash, dob, gender });
    const token = jwt.sign({ userId: user._id, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, dob: user.dob, gender: user.gender } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    await connectDB();
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
    
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Missing phone or password' });
    }

    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ userId: user._id, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, dob: user.dob, gender: user.gender } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ========== QR ROUTES ==========

const WINDOW_SECONDS = 30;

function generateQRToken(userId, ticketId, secret) {
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload = {
    userId,
    ticketId,
    issuedAt: now,
    expiry: now + WINDOW_SECONDS,
    nonce,
    window: Math.floor(now / WINDOW_SECONDS),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64');

  return { qrData: `${payloadB64}.${sig}`, payload, expiresIn: WINDOW_SECONDS };
}

app.post('/qr/generate', authMiddleware, (req, res) => {
  try {
    if (!QR_HMAC_SECRET) throw new Error('QR_HMAC_SECRET not configured');
    const { ticketId = 'AICTSL-PASS-001' } = req.body;
    const result = generateQRToken(req.user.userId, ticketId, QR_HMAC_SECRET);
    res.json(result);
  } catch (e) {
    console.error('QR Generate error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/qr/verify', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    if (!QR_HMAC_SECRET) throw new Error('QR_HMAC_SECRET not configured');
    
    const { qrData } = req.body;
    const [payloadB64, sig] = qrData.split('.');
    if (!payloadB64 || !sig) return res.status(400).json({ valid: false, reason: 'Malformed QR' });

    const expectedSig = crypto.createHmac('sha256', QR_HMAC_SECRET).update(payloadB64).digest('base64');
    if (expectedSig !== sig) return res.status(400).json({ valid: false, reason: 'Invalid signature' });

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.expiry) return res.status(400).json({ valid: false, reason: 'QR expired' });

    const tokenHash = crypto.createHash('sha256').update(qrData).digest('hex');
    const already = await ScannedToken.findOne({ tokenHash });
    if (already) return res.status(400).json({ valid: false, reason: 'Replay attack detected - token already used' });

    await ScannedToken.create({ tokenHash, userId: payload.userId, ticketId: payload.ticketId });
    res.json({ valid: true, payload });
  } catch (e) {
    console.error('QR Verify error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/qr/secret', authMiddleware, (req, res) => {
  if (!QR_HMAC_SECRET) return res.status(500).json({ error: 'QR_HMAC_SECRET not configured' });
  res.json({ hmacSecret: QR_HMAC_SECRET });
});

// ========== ERROR HANDLERS ==========

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]:', err);
  res.status(500).json({ 
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

module.exports = app;
