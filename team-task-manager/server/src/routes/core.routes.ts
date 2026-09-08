import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as profile from '../controllers/profileController';
import * as teams from '../controllers/teamController';

const router = Router();
router.use(protect);

router.get('/profile/me', profile.getProfile);
router.patch('/profile/me', profile.updateProfile);
router.get('/teams', teams.listTeams);
router.post('/teams', teams.createTeam);

export default router;
