import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as projects from '../controllers/projectController';

const router = Router();
router.use(protect);

router.get('/', projects.listProjects);
router.post('/', projects.createProject);
router.get('/:id', projects.getProject);
router.patch('/:id', projects.updateProject);
router.delete('/:id', projects.deleteProject);
router.post('/:id/archive', projects.archiveProject);
router.post('/:id/members', projects.addMember);
router.delete('/:id/members/:userId', projects.removeMember);

export default router;
