import { Router } from 'express';
import { getBuyers, createBuyer, getBuyerDetail } from '../controllers/buyerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getBuyers);
router.post('/', createBuyer);
router.get('/:id/detail', getBuyerDetail);

export default router;
