import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

import { logger } from './utils/logger';
import { testConnections, sequelize } from './config/database';
import authRoutes from './routes/auth.routes';
import experimentRoutes from './routes/experiment.routes';
import projectRoutes from './routes/project.routes';
import trackingRoutes from './routes/tracking.routes';
import { responseWrapper, errorResponseWrapper } from './middleware/response.middleware';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);

// Response wrapper middleware (must be before routes)
app.use(responseWrapper);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorResponseWrapper);

// Start server
const startServer = async () => {
  try {
    // Test database connections
    const connected = await testConnections();
    
    if (connected) {
      // Sync PostgreSQL models
      await sequelize.sync({ alter: true });
      logger.info('Database synced successfully');
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    logger.info('Starting server without database connection...');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} (no database)`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  }
};

startServer();