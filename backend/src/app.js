require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('express-async-errors'); // Error handler wrapper for async routes

// Import routes (we will create these later)
const routes = require('./routes/index');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Initialize Daemon Watcher
const daemon = require('./cron/daemon');
daemon.startWatcher();

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found on this server.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
