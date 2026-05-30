require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Customize this for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Basic sanity check route
app.get('/', (req, res) => {
  res.json({ message: 'IT Helpdesk MRA Group API is running.' });
});

// Mount modular routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/companies', require('../routes/companies'));
app.use('/api/tickets', require('../routes/tickets'));
app.use('/api/reports', require('../routes/reports'));
app.use('/api/performance', require('../routes/performance'));
app.use('/api/users', require('../routes/users'));
app.use('/api/wifi', require('../routes/wifi'));
app.use('/api/subscriptions', require('../routes/subscriptions'));
app.use('/api/assets', require('../routes/assets'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Local server listen (Only when running locally, not on Vercel)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running locally on port ${PORT}`);
  });
}

module.exports = app;
