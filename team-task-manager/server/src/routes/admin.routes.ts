import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as admin from '../controllers/adminController';
import { adminAnalytics } from '../controllers/reportController';

const router = Router();
router.use(protect);

router.get('/permissions', admin.permissions);
router.get('/audit-logs', admin.auditLogs);
router.get('/system-settings', admin.getSystemSettings);
router.put('/system-settings', admin.updateSystemSettings);
router.get('/analytics', adminAnalytics);
router.get('/public-info', admin.publicInfo);

export default router;
