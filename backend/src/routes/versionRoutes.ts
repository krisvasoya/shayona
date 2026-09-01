import { Router } from 'express';
import { getVersion } from '../controllers/versionController';

const router = Router();

// Public endpoint for checking app version and OTA APK download URL
router.get('/', getVersion);

export default router;
