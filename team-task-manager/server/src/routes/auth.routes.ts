import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth';
import * as auth from '../controllers/authController';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/register', authLimiter, auth.register);
router.post('/login', authLimiter, auth.login);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/reset-password', authLimiter, auth.resetPassword);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.me);
router.post('/change-password', protect, auth.changePassword);
router.get('/sessions', protect, auth.listSessions);
router.post('/sessions/revoke', protect, auth.revokeSessions);

export default router;
