import { Router } from 'express';
import { protect } from '../middleware/auth';
import { feed } from '../controllers/activityController';

const router = Router();
router.use(protect);
router.get('/', feed);

export default router;
