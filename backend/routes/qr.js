const router = require('express').Router();
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const ScannedToken = require('../models/ScannedToken');

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

// Generate QR pass
router.post('/generate', authMiddleware, (req, res) => {
  try {
    const { ticketId = 'AICTSL-PASS-001' } = req.body;
    const result = generateQRToken(req.user.userId, ticketId, process.env.QR_HMAC_SECRET);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verify QR pass (online replay check)
router.post('/verify', authMiddleware, async (req, res) => {
  try {
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

// Expose shared secret for offline deterministic verification (demo only)
router.get('/secret', authMiddleware, (req, res) => {
  res.json({ hmacSecret: process.env.QR_HMAC_SECRET });
});

module.exports = router;
