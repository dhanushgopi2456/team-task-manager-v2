import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as notifications from '../controllers/notificationController';

const router = Router();
router.use(protect);

router.get('/', notifications.listNotifications);
router.post('/read-all', notifications.markAllRead);
router.patch('/:id/read', notifications.markRead);

export default router;
