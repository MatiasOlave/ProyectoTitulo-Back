import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { studentController } from '../controllers/student.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

// Roles permitidos para gestionar estudiantes
const ALLOWED_ROLES = ['ADMIN', 'DIRECTOR', 'EDUCATOR'];

router.post('/', requireAnyRole(ALLOWED_ROLES), studentController.createStudent);
router.get('/', requireAnyRole(ALLOWED_ROLES), studentController.listStudents);
router.get('/:id', requireAnyRole(ALLOWED_ROLES), studentController.getStudentById);
router.put('/:id', requireAnyRole(ALLOWED_ROLES), studentController.updateStudent);
router.delete('/:id', requireAnyRole(['ADMIN', 'DIRECTOR']), studentController.deleteStudent); // Quizás EDUCATOR no debería borrar

export default router;
