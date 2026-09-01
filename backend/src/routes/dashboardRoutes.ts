import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/stats', getDashboardStats);

export default router;
