import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import calculatorRoutes from './routes/calculatorRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

export function createApp() {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxies
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logger
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General Rate Limiter (200 requests per 15 minutes per IP)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  });
  app.use('/api', limiter);

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Khushal Finance Backend API',
      version: '1.0.0',
      database: 'MongoDB Atlas',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/calculator', calculatorRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Root welcome
  app.get('/', (req, res) => {
    res.json({
      name: 'Khushal Finance API',
      documentation: '/api/health',
      version: '1.0.0',
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export default createApp;
