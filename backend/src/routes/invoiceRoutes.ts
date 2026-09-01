import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  recordPayment,
} from '../controllers/invoiceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.post('/:id/payments', recordPayment);

export default router;
