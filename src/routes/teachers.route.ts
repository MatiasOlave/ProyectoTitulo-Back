import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, getTeacherDetails } from '../controllers/teachers.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getTeachers);
router.get('/:id', getTeacherDetails);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
