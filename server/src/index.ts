import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import uploadRoutes from './routes/upload.js';
import imagesRoutes from './routes/images.js';
import searchRoutes from './routes/search.js';
import { getQueueStatus } from './services/aiProcessor.js';

// Validate environment variables
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', (error as Error).message);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const queueStatus = getQueueStatus();
  res.json({
    status: 'ok',
    message: 'Server is running',
    queue: queueStatus,
  });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/search', searchRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/api/health`);
  console.log(`🔐 Environment: ${config.nodeEnv}`);
});

