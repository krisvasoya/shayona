import { Router } from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomer);

export default router;
