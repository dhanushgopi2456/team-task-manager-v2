import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as comments from '../controllers/commentController';

const router = Router();
router.use(protect);

router.get('/:taskId/comments', comments.listComments);
router.post('/:taskId/comments', comments.addComment);
router.delete('/c/:id', comments.deleteComment);

export default router;
