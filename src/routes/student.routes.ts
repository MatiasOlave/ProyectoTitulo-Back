import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { studentController } from '../controllers/student.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

router.post('/', studentController.createStudent);
router.get('/', studentController.listStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

export default router;
