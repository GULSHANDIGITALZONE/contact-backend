// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const Message = require('./messageModel');

const app = express();
app.use(express.json());

// CORS - allow your frontend origin(s). For deployment, set proper origin.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// connect mongo
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/contactdb';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connect error:', err.message));

// ---- Static file (frontend) ----
app.use(express.static(path.join(__dirname, '/')));

// --- Public route to create a message (contact form) ---
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Name and message required' });

    const msg = new Message({ name, email, subject, message });
    await msg.save();
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Get non-deleted messages (admin inbox) ---
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({ deleted: false }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Get deleted messages (trash) ---
app.get('/api/messages/deleted', async (req, res) => {
  try {
    const deletedMessages = await Message.find({ deleted: true }).sort({ deletedAt: -1 });
    res.json(deletedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Soft-delete a message (admin) ---
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const msg = await Message.findByIdAndUpdate(
      id,
      { deleted: true, deletedAt: new Date(), deletedBy: req.body.admin || 'admin' },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message: 'Message moved to Trash', data: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Restore a deleted message ---
app.post('/api/messages/:id/restore', async (req, res) => {
  try {
    const id = req.params.id;
    const msg = await Message.findByIdAndUpdate(
      id,
      { deleted: false, deletedAt: null, deletedBy: null },
      { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message: 'Message restored', data: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Permanently delete a message (admin) ---
app.delete('/api/messages/:id/permanent', async (req, res) => {
  try {
    const id = req.params.id;
    const removed = await Message.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message: 'Message permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// fallback to index.html for frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
