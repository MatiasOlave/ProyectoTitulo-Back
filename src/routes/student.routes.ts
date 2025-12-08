import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { requirePermission } from '../middlewares/auth/permission.middleware';
import { studentController } from '../controllers/student.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

router.post('/', requirePermission('student:create'), studentController.createStudent);
router.get('/', requirePermission('student:read'), studentController.listStudents);
router.get('/:id', requirePermission('student:read'), studentController.getStudentById);
router.put('/:id', requirePermission('student:update'), studentController.updateStudent);
router.delete('/:id', requirePermission('student:delete'), studentController.deleteStudent);

export default router;
