import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as tasks from '../controllers/taskController';

const router = Router();
router.use(protect);

router.get('/', tasks.listTasks);
router.post('/', tasks.createTask);
router.get('/:id', tasks.getTask);
router.patch('/:id', tasks.updateTask);
router.delete('/:id', tasks.deleteTask);
router.post('/:id/attachments', tasks.addAttachment);

export default router;
