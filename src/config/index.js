import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/khushal_finance',
  jwt: {
    secret: process.env.JWT_SECRET || 'khushal_finance_jwt_secret_default_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  corsOrigin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  upload: {
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    dir: process.env.UPLOAD_DIR || './uploads',
  },
  email: {
    brevoApiKey: process.env.BREVO_API_KEY || '',
    from: process.env.EMAIL_FROM || 'khushalfinance12@gmail.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Khushal Finance',
    adminEmail: process.env.ADMIN_EMAIL || 'khushalfinance12@gmail.com',
  },
};
