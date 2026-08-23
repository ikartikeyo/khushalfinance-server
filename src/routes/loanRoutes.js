import { Router } from 'express';
import {
  getLoanProducts,
  getLoanProductBySlug,
  createLoanProduct,
  updateLoanProduct,
  deleteLoanProduct,
} from '../controllers/loanController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Public loan catalog endpoints
router.get('/', getLoanProducts);
router.get('/:identifier', getLoanProductBySlug);

// Admin-only management endpoints
router.post('/', authenticate, authorize('ADMIN'), createLoanProduct);
router.put('/:id', authenticate, authorize('ADMIN'), updateLoanProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteLoanProduct);

export default router;
