import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { levelController } from '../controllers/level.controller';

import { requireAnyRole } from '../middlewares/auth/permission.middleware';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

const WRITE_ROLES = ['Administrador', 'Director'];
const READ_ROLES = ['Administrador', 'Director', 'Profesor'];

router.get('/', requireAnyRole(READ_ROLES), levelController.listLevels);
router.post('/', requireAnyRole(WRITE_ROLES), levelController.createLevel);
router.put('/:id', requireAnyRole(WRITE_ROLES), levelController.updateLevel);
router.delete('/:id', requireAnyRole(WRITE_ROLES), levelController.deleteLevel);
router.post('/:levelId/assign_student', requireAnyRole(WRITE_ROLES), levelController.assignStudent);
router.get('/:levelId/students', requireAnyRole(READ_ROLES), levelController.getStudentsByLevel);
router.get('/:id', requireAnyRole(READ_ROLES), levelController.getLevelDetails);

export default router;
