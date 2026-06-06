require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Models and routes
const User = require('../models/User');
const ScannedToken = require('../models/ScannedToken');
const authMiddleware = require('../middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB once
let mongoConnected = false;
const connectDB = async () => {
  if (mongoConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    mongoConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('DB connection error:', err);
    throw err;
  }
};

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Auth Routes
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB();
    const { name, phone, password, dob, gender } = req.body;
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ error: 'Phone already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, phone, password: hash, dob, gender });
    const token = jwt.sign({ userId: user._id, name: user.name, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, dob: user.dob, gender: user.gender } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ userId: user._id, name: user.name, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, dob: user.dob, gender: user.gender } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// QR Routes
const crypto = require('crypto');
const WINDOW_SECONDS = 30;

function generateQRToken(userId, ticketId, secret) {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / WINDOW_SECONDS);
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload = {
    userId,
    ticketId,
    issuedAt: now,
    expiry: now + WINDOW_SECONDS,
    nonce,
    window,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64');

  return { qrData: `${payloadB64}.${sig}`, payload, expiresIn: WINDOW_SECONDS };
}

app.post('/api/qr/generate', authMiddleware, (req, res) => {
  try {
    const { ticketId = 'AICTSL-PASS-001' } = req.body;
    const result = generateQRToken(req.user.userId, ticketId, process.env.QR_HMAC_SECRET);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/qr/verify', authMiddleware, async (req, res) => {
  try {
    await connectDB();
    const { qrData } = req.body;
    const [payloadB64, sig] = qrData.split('.');
    if (!payloadB64 || !sig) return res.status(400).json({ valid: false, reason: 'Malformed QR' });

    const expectedSig = crypto.createHmac('sha256', process.env.QR_HMAC_SECRET).update(payloadB64).digest('base64');
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
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/qr/secret', authMiddleware, (req, res) => {
  res.json({ hmacSecret: process.env.QR_HMAC_SECRET });
});

module.exports = app;
