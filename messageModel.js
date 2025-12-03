// messageModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // Soft-delete fields
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: null } // store admin id/email optionally
});

// add an index to help queries
messageSchema.index({ deleted: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
