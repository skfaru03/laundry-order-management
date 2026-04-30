require('dotenv').config({ override: true });

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const orderRoutes     = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app       = express();
const PORT      = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/orders',    orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve frontend for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid order ID format' });
  }

  // MongoDB not connected
  if (err.name === 'MongoNotConnectedError' || err.message?.includes('buffering timed out')) {
    return res.status(503).json({
      success: false,
      message: 'Database not available. Please ensure MongoDB is running.',
    });
  }

  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ---------------------------------------------------------------------------
// START SERVER FIRST — then try MongoDB
// The server always starts so the frontend loads regardless of DB status.
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🧺 CleanPress — Laundry Order Management System`);
  console.log(`✅ Server running at:  http://localhost:${PORT}`);
  console.log(`📦 API base:          http://localhost:${PORT}/api`);
  console.log(`🌐 Open this URL in your browser: http://localhost:${PORT}\n`);
});

// Try MongoDB connection separately — won't block the server from starting
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log(`🍃 MongoDB connected: ${MONGO_URI}\n`);
  })
  .catch((err) => {
    console.warn(`⚠️  MongoDB not connected: ${err.message}`);
    console.warn(`   Running in degraded mode — API will return errors until MongoDB is available.`);
    console.warn(`   To fix: install MongoDB locally or set MONGODB_URI in .env to a MongoDB Atlas URL\n`);
  });

module.exports = app;
