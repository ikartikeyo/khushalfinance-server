import { Router } from 'express';
import {
  createEnquiry,
  getEnquiries,
  getEnquiryByIdOrRef,
  trackEnquiryPublic,
  updateStatus,
  assignOfficer,
  addNotes,
  exportCsv,
  deleteEnquiry,
  bulkDeleteEnquiries,
} from '../controllers/enquiryController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateEnquiry, validateStatusUpdate } from '../middleware/validationMiddleware.js';

const router = Router();

// Public application submission & tracking
router.post('/', validateEnquiry, createEnquiry);
router.get('/track/:refNumber', trackEnquiryPublic);

// CSV Export (Authenticated Staff/Admin)
router.get('/export/csv', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER'), exportCsv);

// Bulk Delete (Admin only)
router.post('/bulk-delete', authenticate, authorize('ADMIN'), bulkDeleteEnquiries);

// List & Retrieve applications (Staff/Admin)
router.get('/', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'VIEWER'), getEnquiries);
router.get('/:identifier', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'VIEWER'), getEnquiryByIdOrRef);

// State transitions & assignments (Staff/Admin)
router.patch('/:id/status', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER'), validateStatusUpdate, updateStatus);
router.patch('/:id/assign', authenticate, authorize('ADMIN', 'LOAN_OFFICER'), assignOfficer);
router.post('/:id/notes', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'UNDERWRITER'), addNotes);

// Delete / Archive (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEnquiry);

export default router;
