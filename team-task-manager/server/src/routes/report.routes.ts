import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as reports from '../controllers/reportController';

const router = Router();
router.use(protect);

router.get('/dashboard', reports.dashboard);
router.get('/', reports.reports);

export default router;
