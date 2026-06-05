const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
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

// Login
router.post('/login', async (req, res) => {
  try {
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

module.exports = router;
