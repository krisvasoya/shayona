import { Router } from 'express';
import { getShopProfile } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getShopProfile);

export default router;
