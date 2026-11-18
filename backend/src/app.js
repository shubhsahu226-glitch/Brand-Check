const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('./lib/prisma');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'ok',
      service: 'brandcheck-backend',
      database: 'connected',
    });
  } catch (error) {
    return res.status(200).json({
      status: 'degraded',
      service: 'brandcheck-backend',
      database: 'disconnected',
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    status: 'error',
    message: error.status ? error.message : 'Internal server error',
  });
});

module.exports = app;
