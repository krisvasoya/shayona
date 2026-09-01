import { Router } from 'express';
import { getBuyers, createBuyer } from '../controllers/buyerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getBuyers);
router.post('/', createBuyer);

export default router;
