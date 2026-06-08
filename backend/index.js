require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// For local development only
app.use('/api/auth', require('./routes/auth'));
app.use('/api/qr', require('./routes/qr'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', environment: 'local' }));

// Connection for local dev
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chalo')
    .then(() => {
      console.log('✅ MongoDB connected');
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    })
    .catch(err => console.error('❌ DB error:', err));
} else {
  console.log('Running in production/Vercel mode - use api/index.js');
}
