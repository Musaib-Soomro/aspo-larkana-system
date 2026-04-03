require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    // Allow Vercel preview/production deployments
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

module.exports = app;
