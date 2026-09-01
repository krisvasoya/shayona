import { Router } from 'express';
import { createInvoice } from '../controllers/invoiceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createInvoice);

export default router;
