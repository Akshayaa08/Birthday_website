import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { assertAuthConfiguration, optionalAuth } from './middleware/auth.js';
import reactionRoutes from './routes/reactionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import videoRoutes from './routes/videoRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const configuredClientUrl = process.env.CLIENT_URL;
if (process.env.NODE_ENV === 'production' && !configuredClientUrl) {
  throw new Error('CLIENT_URL must be set to the deployed frontend origin in production.');
}
const clientOriginUrl = new URL(configuredClientUrl || 'http://localhost:5173');
if (
  process.env.NODE_ENV === 'production' &&
  ['localhost', '127.0.0.1', '::1'].includes(clientOriginUrl.hostname)
) {
  throw new Error('CLIENT_URL must not point to localhost in production.');
}
const clientOrigin = clientOriginUrl.origin;

assertAuthConfiguration();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', optionalAuth);
app.use('/api/auth', authRoutes);
app.use('/api', activityRoutes);
app.use('/api', videoRoutes);
app.use('/api', reactionRoutes);

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (err) {
    console.error('❌ SERVER UPLOAD ERROR');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Field:', err.field);

    const statusCode =
      err.code === 'LIMIT_FILE_SIZE'
        ? 413
        : 400;

    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Upload failed',
      code: err.code || null,
      field: err.field || null,
    });
  }

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '19-Day Birthday Journey API is running ❤️',
    time: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Birthday Website API is running',
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `💖 Birthday Journey Server running on http://localhost:${PORT}`
  );
});