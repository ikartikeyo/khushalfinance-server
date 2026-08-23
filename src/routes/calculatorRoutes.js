import { Router } from 'express';
import {
  calculateEmiEndpoint,
  calculateEligibilityEndpoint,
  compareLoanTenuresEndpoint,
} from '../controllers/calculatorController.js';
import {
  validateEmiCalculation,
  validateEligibility,
} from '../middleware/validationMiddleware.js';

const router = Router();

// Public financial calculation tools
router.post('/emi', validateEmiCalculation, calculateEmiEndpoint);
router.post('/eligibility', validateEligibility, calculateEligibilityEndpoint);
router.post('/compare', compareLoanTenuresEndpoint);

export default router;
