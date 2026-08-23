import { Router } from 'express';
import {
  createContact,
  getContacts,
  updateContactStatus,
  deleteContact,
  bulkDeleteContacts,
} from '../controllers/contactController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateContact } from '../middleware/validationMiddleware.js';

const router = Router();

// Public quick enquiry submission
router.post('/', validateContact, createContact);

// Staff / Admin endpoints
router.post('/bulk-delete', authenticate, authorize('ADMIN'), bulkDeleteContacts);
router.get('/', authenticate, authorize('ADMIN', 'LOAN_OFFICER', 'VIEWER'), getContacts);
router.patch('/:id', authenticate, authorize('ADMIN', 'LOAN_OFFICER'), updateContactStatus);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteContact);

export default router;
