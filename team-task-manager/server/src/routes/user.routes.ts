import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as users from '../controllers/userController';

const router = Router();
router.use(protect);

// Directory available to every authenticated user (must precede /:id)
router.get('/directory/all', users.directory);

// Admin management (role enforced inside controllers)
router.get('/', users.listUsers);
router.post('/', users.createUser);
router.patch('/:id', users.updateUser);
router.delete('/:id', users.deleteUser);
router.post('/:id/reset-password', users.resetUserPassword);

export default router;
