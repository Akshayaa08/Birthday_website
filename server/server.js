import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import reactionRoutes from './routes/reactionRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local fallback uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', reactionRoutes);

// Multer / upload error handler
// app.use((err, req, res, next) => {
//   if (err) {
//     console.error('❌ SERVER UPLOAD ERROR');
//     console.error('Message:', err.message);
//     console.error('Code:', err.code);
//     console.error('Field:', err.field);

//     return res.status(500).json({
//       success: false,
//       error: err.message || 'Upload failed',
//       code: err.code || null,
//       field: err.field || null,
//     });
//   }

//   next();
// });

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

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Birthday Website API is running"
  });
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`💖 Birthday Journey Server running on http://localhost:${PORT}`);
});
