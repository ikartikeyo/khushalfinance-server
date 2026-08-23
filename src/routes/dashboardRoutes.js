import { Router } from 'express';
import {
  getDashboardStats,
  getDashboardAnalytics,
} from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Staff and Admin Dashboard Endpoints
router.get('/stats', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'VIEWER'), getDashboardStats);
router.get('/analytics', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'VIEWER'), getDashboardAnalytics);

export default router;
