import { Router } from 'express';
import {
  login,
  getMe,
  registerStaff,
  listUsers,
  updateUser,
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateLogin, validateRegister } from '../middleware/validationMiddleware.js';

import rateLimit from 'express-rate-limit';

const router = Router();

// Strict login rate limiter: max 15 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
  },
});

// Public login
router.post('/login', loginLimiter, validateLogin, login);

// Authenticated user profile
router.get('/me', authenticate, getMe);

// Admin-only management endpoints
router.post('/register', authenticate, authorize('ADMIN'), validateRegister, registerStaff);
router.get('/users', authenticate, authorize('ADMIN'), listUsers);
router.patch('/users/:id', authenticate, authorize('ADMIN'), updateUser);

export default router;
