const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: String, default: '' },
  gender: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
