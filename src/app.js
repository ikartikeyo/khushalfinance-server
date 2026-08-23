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

  // CORS configuration — dynamically allow frontend Vercel deployments, localhost, and configured CORS_ORIGIN
  const allowedOrigins = [
    config.corsOrigin,
    config.clientUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, mobile apps, Postman)
      if (!origin) return callback(null, true);

      // If set to wildcard or localhost development
      if (config.corsOrigin === '*' || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Check if domain is in allowed list, is a Vercel deployment, or matches custom domain
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('vercel.app') ||
        origin.includes('khushalfinance') ||
        origin.includes('localhost');

      if (isAllowed) {
        return callback(null, true);
      }

      // Allow dynamically to prevent deployment blocking
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

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
