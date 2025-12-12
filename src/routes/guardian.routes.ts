import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth/auth.middleware';
import { companyContextMiddleware } from '../middlewares/company-context.middleware';
import { requireAnyRole } from '../middlewares/auth/permission.middleware';
import { guardianController } from '../controllers/guardian.controller';

const router = Router();

router.use(authMiddleware);
router.use(companyContextMiddleware);

const READ_ROLES = ['ADMIN', 'DIRECTOR', 'TEACHER'];

router.get('/', requireAnyRole(READ_ROLES), guardianController.listGuardians);

export default router;
