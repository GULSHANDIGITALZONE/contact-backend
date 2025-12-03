// messageModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  subject: String,
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // Soft-delete fields
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

  // optional: who deleted (admin id or email)
  deletedBy: { type: String, default: null }
});

module.exports = mongoose.model('Message', messageSchema);
