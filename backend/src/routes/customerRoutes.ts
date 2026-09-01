import { Router } from 'express';
import { getCustomers, createCustomer, getCustomerDetail } from '../controllers/customerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id/detail', getCustomerDetail);

export default router;
